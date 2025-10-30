import { Injectable, Logger } from '@nestjs/common';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class EventUpdateAgentService {
  private readonly logger = new Logger(EventUpdateAgentService.name);
  private llmModelName: string;

  constructor(
    private readonly canopusService: CanopusService,
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.llmModelName = this.appConfigService.llmModelName;
  }

  async extractAndUpdateEvents(
    userId: number,
    organizationId: number,
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    conversationHistory?: string,
    recentEvents?: any[],
    availablePersonIds?: number[],
    availableCompanyIds?: number[],
  ): Promise<number[]> {
    const eventStatusOptions = await this.prisma.configurableOption.findMany({
      where: {
        field: {
          organizationId,
          entityType: 'event',
          fieldName: 'status',
        },
        isActive: true,
      },
    });

    const statusList = eventStatusOptions
      .map((opt) => `"${opt.value}"`)
      .join(', ');

    const contextStr = conversationHistory
      ? `Recent conversation:\n${conversationHistory}\n\nLatest exchange:\n`
      : '';

    const conversationText = `${contextStr}User: ${userMessage}\nAssistant: ${aiResponse}`;

    const recentEventsContext =
      recentEvents && recentEvents.length > 0
        ? '\n\nRECENT EVENTS IN DATABASE:\n' +
          recentEvents
            .map(
              (e, idx) =>
                `${idx + 1}. [ID: ${e.id}] "${e.title}" - ${e.eventDate?.toISOString().split('T')[0]} at ${e.eventTime || 'no time'}`,
            )
            .join('\n')
        : '';

    const systemPrompt = `You are an event update detection specialist.

Current Date: ${new Date().toISOString().split('T')[0]}

${recentEventsContext}

**YOUR TASK:** Detect if user wants to MODIFY/RESCHEDULE/UPDATE an existing event.

**DETECTION RULES:**

1. **Explicit Update Intent:**
   - "move my meeting to Friday"
   - "reschedule the call to 3pm"
   - "change hospital visit to tomorrow"
   - "postpone my meeting"
   - "make the meeting high priority"

2. **Implicit Update Intent:**
   - "actually make that 2pm" (referring to recent event)
   - "change it to Friday" (context-based reference)
   - "add john to the meeting" (modification)
   - User mentions change AND assistant confirms it ("I've rescheduled...")

3. **Check Assistant Response:**
   - If assistant says "I've moved", "I've rescheduled", "I've updated" → definitely an UPDATE
   - This is the strongest signal!

4. **Event Matching Strategy:**
   - Match user's keywords to RECENT EVENTS listed above
   - If ambiguous (multiple matches), prefer the MOST RECENT event
   - Consider partial matches (e.g., "meeting" matches "Meeting with Adel")
   - Look for related people/companies mentioned (e.g., "meeting with adel" → find event with Adel)

5. **Multi-Field Updates:**
   Extract ALL changes mentioned:
   - Date: "move to Friday"
   - Time: "change to 3pm"
   - Location: "at office"
   - People: "add john"
   - Companies: "change venue to Hilton"
   - Status: "cancel", "mark complete"
   - Priority: "make it urgent"

**MATCHING EXAMPLES:**

Example 1 - Clear Match:
Recent Events: [ID: 42] "Meeting with Adel" - 2025-10-25 at 11:00
User: "move my meeting with adel to 2pm"
→ Match ID 42, update time to 14:00

Example 2 - Implicit Reference:
Recent Events: [ID: 55] "Call John" - 2025-10-24
User: "actually change that call to tomorrow"
→ Match ID 55 (most recent), update date to 2025-10-25

Example 3 - Adding People:
Recent Events: [ID: 67] "Team meeting" - 2025-10-26
User: "add sarah to the team meeting"
→ Match ID 67, add "Sarah" to relatedPeople

Example 4 - Multiple Changes:
Recent Events: [ID: 88] "Hospital visit" - 2025-10-25 at 16:00
User: "move hospital visit to friday 10am and add note to bring reports"
→ Match ID 88, update date to 2025-10-27, time to 10:00, description to include reports

**VALID STATUS VALUES** (use ONLY these if user mentions event status):
${statusList}

**AMBIGUITY HANDLING:**
- If user says "my meeting" and there are 3 meetings → pick the CLOSEST upcoming one
- If still unclear → extract but include all possible matches in response

**OUTPUT FORMAT (JSON ARRAY):**
[
  {
    "eventId": 123,
    "confidence": "high" | "medium" | "low",
    "updates": {
      "eventDate": "2025-10-26",
      "eventTime": "14:00",
      "location": "Office Building A",
      "status": "pending",
      "priority": "high",
      "description": "Updated description",
      "relatedPeople": ["John", "Sarah"],
      "relatedCompanies": ["Company X"]
    }
  }
]

**IMPORTANT:**
- Only include fields that need updating (don't send null/unchanged fields)
- For ambiguous matches, set confidence: "low"
- If NO events to update OR can't match to existing event, return []

**CONVERSATION TO ANALYZE:**
${conversationText}

Return ONLY valid JSON array.`;

    try {
      const response = await this.canopusService.callModel(
        ModelType.TEXT,
        this.llmModelName,
        {
          prompt: conversationText,
          systemPrompt,
        },
      );

      this.logger.log('[EventUpdate] Raw LLM response:', response.content);

      const jsonMatch = response.content.match(/\[\s*\{[\s\S]*?\}\s*\]/);

      if (!jsonMatch) {
        this.logger.warn('[EventUpdate] No JSON array found');
        return [];
      }

      const updateRequests = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(updateRequests) || updateRequests.length === 0) {
        this.logger.debug('[EventUpdate] Empty array returned');
        return [];
      }

      const updatedEventIds: number[] = [];

      for (const updateReq of updateRequests) {
        if (!updateReq.eventId || !updateReq.updates) continue;

        const updateData: any = {};

        if (updateReq.updates.eventDate) {
          updateData.eventDate = new Date(updateReq.updates.eventDate);
        }
        if (updateReq.updates.eventTime) {
          updateData.eventTime = updateReq.updates.eventTime;
        }
        if (updateReq.updates.location) {
          updateData.location = updateReq.updates.location;
        }
        if (updateReq.updates.status) {
          updateData.status = updateReq.updates.status;
        }
        if (updateReq.updates.title) {
          updateData.title = updateReq.updates.title;
        }

        // Update event
        await this.prisma.event.update({
          where: { id: updateReq.eventId, userId, organizationId, },
          data: updateData,
        });

        updatedEventIds.push(updateReq.eventId);
        this.logger.log(`✅ Event updated: ID ${updateReq.eventId}`);

        // LINK PEOPLE TO UPDATED EVENT (if mentioned)
        if (
          updateReq.updates.relatedPeople &&
          Array.isArray(updateReq.updates.relatedPeople) &&
          availablePersonIds
        ) {
          for (const personName of updateReq.updates.relatedPeople) {
            const person = await this.prisma.person.findFirst({
              where: {
                userId,
                organizationId,
                name: { equals: personName, mode: 'insensitive' },
              },
            });

            if (person && availablePersonIds.includes(person.id)) {
              try {
                await this.prisma.eventPerson.create({
                  data: {
                    eventId: updateReq.eventId,
                    personId: person.id,
                  },
                });
                this.logger.log(
                  `🔗 Linked person "${personName}" to updated event ${updateReq.eventId}`,
                );
              } catch (error) {
                this.logger.warn(`Person link already exists: ${personName}`);
              }
            }
          }
        }

        // LINK COMPANIES TO UPDATED EVENT (if mentioned)
        if (
          updateReq.updates.relatedCompanies &&
          Array.isArray(updateReq.updates.relatedCompanies) &&
          availableCompanyIds
        ) {
          for (const companyName of updateReq.updates.relatedCompanies) {
            const company = await this.prisma.company.findFirst({
              where: {
                userId,
                organizationId,
                name: { equals: companyName, mode: 'insensitive' },
              },
            });

            if (company && availableCompanyIds.includes(company.id)) {
              try {
                await this.prisma.eventCompany.create({
                  data: {
                    eventId: updateReq.eventId,
                    companyId: company.id,
                  },
                });
                this.logger.log(
                  `🔗 Linked company "${companyName}" to updated event ${updateReq.eventId}`,
                );
              } catch (error) {
                this.logger.warn(`Company link already exists: ${companyName}`);
              }
            }
          }
        }
      }

      return updatedEventIds;
    } catch (error) {
      this.logger.error('Event update failed:', error);
      return [];
    }
  }
}
