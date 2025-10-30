import { Injectable, Logger } from '@nestjs/common';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class PersonAgentService {
  private readonly logger = new Logger(PersonAgentService.name);
  private llmModelName: string;

  constructor(
    private readonly canopusService: CanopusService,
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.llmModelName = this.appConfigService.llmModelName;
  }

  async extractAndCreatePeople(
    userId: number,
    organizationId: number,
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    conversationHistory?: string,
  ): Promise<number[]> {
    const personStatusOptions = await this.prisma.configurableOption.findMany({
      where: {
        field: {
          organizationId,
          entityType: 'person',
          fieldName: 'status',
        },
        isActive: true,
      },
    });

    const statusList = personStatusOptions
      .map((opt) => `"${opt.value}"`)
      .join(', ');

    const contextStr = conversationHistory
      ? `Recent conversation:\n${conversationHistory}\n\nLatest exchange:\n`
      : '';

    const conversationText = `${contextStr}User: ${userMessage}\nAssistant: ${aiResponse}`;

    const systemPrompt = `Extract every person mentioned with ANY details provided.

RULES:
1. Extract names even if minimal details (just name is OK)
2. For "meeting with Ajay" → extract {"name": "Ajay"}
3. For "call Dr. Smith at 9876543210" → extract {"name": "Dr. Smith", "phone": "9876543210"}
4. For "update Ajay phone number to 9898989898" → extract {"name": "Ajay", "phone": "9898989898"}
5. For "mark Ajay as hot lead" → extract {"name": "Ajay", "status": "Hot Lead"}
6. For "Ajay is now a client" → extract {"name": "Ajay", "status": "Client"}
7. DO NOT extract generic references like "someone", "anyone", "people"
8. Extract role/phone/email/notes/status ONLY if explicitly mentioned
    - "Ajay is my colleague" → role: "colleague"
    - "Dr. Smith" → role: "doctor"
    - "my friend Sarah" → role: "friend"

**VALID STATUS VALUES** (use ONLY these if user mentions person status):
${statusList}

**STATUS KEYWORDS MAPPING:**
- "lead", "potential lead" → "Lead"
- "follow up", "need to follow up" → "Follow Up"  
- "hot lead", "very interested" → "Hot Lead"
- "client", "customer", "signed" → "Client"
- "inactive", "not interested" → "Inactive"

OUTPUT: Valid JSON array:

[
  {"name": "Ajay", "role": null, "phone": "9898989898", "email": null, "notes": null, "status": null},
  {"name": "Dr. Smith", "role": "doctor", "phone": "9876543210", "email": null, "notes": "Very interested", "status": "Hot Lead"}
]

If NO specific person mentioned, return []`;

    try {
      const response = await this.canopusService.callModel(
        ModelType.TEXT,
        this.llmModelName,
        {
          prompt: conversationText,
          systemPrompt,
        },
      );

      const jsonMatch = response.content.match(/\[\s*(\{[\s\S]*?\})?\s*\]/);
      if (!jsonMatch) {
        return [];
      }

      const extractedPeople = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(extractedPeople) || extractedPeople.length === 0) {
        return [];
      }

      const processedPersonIds: number[] = [];

      for (const personData of extractedPeople) {
        if (!personData.name) continue;

        // Check if person already exists
        const existing = await this.prisma.person.findFirst({
          where: {
            userId,
            organizationId,
            name: { equals: personData.name, mode: 'insensitive' },
          },
        });

        if (existing) {
          // 🔥 UPDATE LOGIC: Merge new data with existing data
          const updateData: any = {};

          if (personData.role !== undefined && personData.role !== null) {
            updateData.role = personData.role;
          }
          if (personData.phone !== undefined && personData.phone !== null) {
            updateData.phone = personData.phone;
          }
          if (personData.email !== undefined && personData.email !== null) {
            updateData.email = personData.email;
          }
          if (personData.notes !== undefined && personData.notes !== null) {
            updateData.notes = personData.notes;
          }
          if (personData.status !== undefined && personData.status !== null) {
            updateData.status = personData.status;
          }

          // Only update if there's new data
          if (Object.keys(updateData).length > 0) {
            await this.prisma.person.update({
              where: { id: existing.id },
              data: updateData,
            });
            this.logger.log(
              `✅ Person updated: ${existing.name} (ID: ${existing.id}) - Fields: ${Object.keys(updateData).join(', ')}`,
            );
          } else {
            this.logger.debug(
              `Person already exists with no new data: ${personData.name}`,
            );
          }

          processedPersonIds.push(existing.id);
          continue;
        }

        // Create new person
        const person = await this.prisma.person.create({
          data: {
            userId,
            organizationId,
            name: personData.name,
            role: personData.role ?? null,
            phone: personData.phone ?? null,
            email: personData.email ?? null,
            notes: personData.notes ?? null,
            status: personData.status ?? null,
          },
        });

        processedPersonIds.push(person.id);
        this.logger.log(`✅ Person created: ${person.name} (ID: ${person.id})`);
      }

      return processedPersonIds;
    } catch (error) {
      this.logger.error('Person extraction failed:', error);
      return [];
    }
  }
}
