import { Injectable, Logger } from '@nestjs/common';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppConfigService } from 'src/config/app-config.service';
import { Event } from '@prisma/client';

@Injectable()
export class EventCreationAgentService {
  private readonly logger = new Logger(EventCreationAgentService.name);
  private llmModelName: string;

  constructor(
    private readonly canopusService: CanopusService,
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.llmModelName = this.appConfigService.llmModelName;
  }

  async extractAndCreateEvents(
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

    // RECENT EVENTS CONTEXT
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

    const systemPrompt = `You are an event extraction specialist.

Current Date: ${new Date().toISOString().split('T')[0]}

${recentEventsContext}

**CRITICAL RULES:**

1. **Extract if CREATING new events** - look at BOTH user message AND assistant response:
   - User says: "i have meeting...", "remind me...", "schedule...", "need to..."
   - Assistant says: "I've scheduled", "I'll create", "Got it! I'll add"
   
2. **DO NOT extract if LISTING** - both must indicate listing:
   - User asks: "show me", "list", "what's on", "what do I have"
   - Assistant responds: "Here's what's on your schedule", "You have the following"

3. **Extract ALL events mentioned in one message** - user might list multiple

4. **Implicit vs Explicit Intent:**
   - "i have meeting with X" → EXTRACT (implicit creation)
   - "meeting with X tomorrow" → EXTRACT (implicit creation)  
   - "what's my meeting with X" → SKIP (query)

5. **Check assistant confirmation:**
   - If assistant says "I've scheduled" or "I'll create" → definitely EXTRACT
   
6. **Date handling:**
   - If no date mentioned → use TODAY (${new Date().toISOString().split('T')[0]})
   - Extract related person names and company names

**VALID STATUS VALUES** (use ONLY these if user mentions event status):
${statusList}

**MULTI-EVENT EXTRACTION:**
If user mentions multiple events in one message, extract ALL of them.

Example:
User: "i have meeting with adel tomorrow 11am, 4pm visit to hospital, call john after"
→ Extract 3 events:
  1. Meeting with Adel (tomorrow 11:00)
  2. Visit to hospital (tomorrow 16:00)
  3. Call John (reminder)

**OUTPUT FORMAT (JSON ARRAY ONLY):**
[
  {
    "title": "Meeting with Adel",
    "description": null,
    "eventDate": "2025-10-25",
    "eventTime": "11:00",
    "location": null,
    "priority": "medium",
    "category": "professional",
    "type": "event",
    "status": "scheduled",
    "relatedPeople": ["Adel"],
    "relatedCompanies": []
  },
  {
    "title": "Visit to Valli Hospital",
    "eventDate": "2025-10-25",
    "eventTime": "16:00",
    "location": "Valli Hospital",
    "priority": "medium",
    "category": "personal",
    "status": "scheduled",
    "type": "event",
    "relatedPeople": [],
    "relatedCompanies": ["Valli Hospital"]
  },
  {
    "title": "Call John",
    "description": "Call after hospital visit",
    "eventDate": "2025-10-25",
    "eventTime": null,
    "priority": "medium",
    "category": "personal",
    "status": "scheduled",
    "type": "reminder",
    "reminderContext": "Call John after hospital visit",
    "relatedPeople": ["John"],
    "relatedCompanies": []
  }
]

If NO events to create, return: []`;

    try {
      const response = await this.canopusService.callModel(
        ModelType.TEXT,
        this.llmModelName,
        {
          prompt: conversationText,
          systemPrompt,
        },
      );

      this.logger.log('[EventExtraction] Prompt sent to LLM:', {
        prompt: conversationText,
        systemPrompt,
      });
      this.logger.log('[EventExtraction] Raw LLM response:', response.content);

      const jsonMatch = response.content.match(/\[\s*\{[\s\S]*?\}\s*\]/); // 🔥 Better regex

      if (!jsonMatch) {
        this.logger.warn(
          '[EventExtraction] No JSON array found, returning empty',
        );
        return [];
      }

      let extractedEvents: any[] = [];
      try {
        extractedEvents = JSON.parse(jsonMatch[0]);
      } catch (err) {
        this.logger.error('[EventExtraction] JSON parse failed', err);
        return [];
      }

      if (!Array.isArray(extractedEvents) || extractedEvents.length === 0) {
        this.logger.debug('[EventExtraction] Empty array returned by LLM');
        return [];
      }

      const createdEventIds: number[] = [];

      for (const eventData of extractedEvents) {
        this.logger.log(
          '[EventExtraction] Creating event with data:',
          eventData,
        );

        // Check for duplicates
        const existingEvent = await this.prisma.event.findFirst({
          where: {
            userId,
            organizationId,
            title: { equals: eventData.title, mode: 'insensitive' },
            eventDate: eventData.eventDate
              ? new Date(eventData.eventDate)
              : undefined,
          },
        });

        if (existingEvent) {
          this.logger.debug(
            `Duplicate event found: ${eventData.title}, skipping`,
          );
          createdEventIds.push(existingEvent.id);
          continue;
        }

        // Create event
        const event = await this.prisma.event.create({
          data: {
            userId,
            organizationId,
            sessionId,
            title: eventData.title,
            description: eventData.description || null,
            eventDate: eventData.eventDate
              ? new Date(eventData.eventDate)
              : null,
            eventTime: eventData.eventTime || null,
            location: eventData.location || null,
            priority: eventData.priority || 'medium',
            category: eventData.category || 'other',
            type: eventData.type || 'event',
            reminderContext: eventData.reminderContext || null,
            status: 'pending',
          },
        });

        createdEventIds.push(event.id);
        this.logger.log(`✅ Event created: ${event.title} (ID: ${event.id})`);

        // LINK PEOPLE TO EVENT
        if (
          eventData.relatedPeople &&
          Array.isArray(eventData.relatedPeople) &&
          availablePersonIds
        ) {
          for (const personName of eventData.relatedPeople) {
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
                    eventId: event.id,
                    personId: person.id,
                  },
                });
                this.logger.log(
                  `🔗 Linked person "${personName}" to event "${event.title}"`,
                );
              } catch (error) {
                this.logger.warn(
                  `Person link already exists or failed: ${personName}`,
                );
              }
            }
          }
        }

        // LINK COMPANIES TO EVENT
        if (
          eventData.relatedCompanies &&
          Array.isArray(eventData.relatedCompanies) &&
          availableCompanyIds
        ) {
          for (const companyName of eventData.relatedCompanies) {
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
                    eventId: event.id,
                    companyId: company.id,
                  },
                });
                this.logger.log(
                  `🔗 Linked company "${companyName}" to event "${event.title}"`,
                );
              } catch (error) {
                this.logger.warn(
                  `Company link already exists or failed: ${companyName}`,
                );
              }
            }
          }
        }
      }

      return createdEventIds;
    } catch (error) {
      this.logger.error('Event creation failed:', error);
      return [];
    }
  }
}
