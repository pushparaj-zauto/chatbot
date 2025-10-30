import { Injectable, Logger } from '@nestjs/common';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class CompanyAgentService {
  private readonly logger = new Logger(CompanyAgentService.name);
  private llmModelName: string;

  constructor(
    private readonly canopusService: CanopusService,
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.llmModelName = this.appConfigService.llmModelName;
  }

  async extractAndCreateCompanies(
    userId: number,
    organizationId: number,
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    conversationHistory?: string,
  ): Promise<number[]> {
    const companyStatusOptions = await this.prisma.configurableOption.findMany({
      where: {
        field: {
          organizationId,
          entityType: 'company',
          fieldName: 'status',
        },
        isActive: true,
      },
    });

    const statusList = companyStatusOptions
      .map((opt) => `"${opt.value}"`)
      .join(', ');

    const contextStr = conversationHistory
      ? `Recent conversation:\n${conversationHistory}\n\nLatest exchange:\n`
      : '';

    const conversationText = `${contextStr}User: ${userMessage}\nAssistant: ${aiResponse}`;

    const systemPrompt = `Extract companies/organizations mentioned with details.

RULES:
1. Extract ONLY if user provides company details (not just mentions in passing)
2. For "meeting at Google office" → extract {"name": "Google"}
3. For "contract with Acme Corp" → extract company
4. For "update Google location to Mountain View" → extract {"name": "Google", "location": "Mountain View"}
5. For "Google is now in tech industry" → extract {"name": "Google", "industry": "tech"}
6. For "mark Google as active client" → extract {"name": "Google", "status": "Active Client"}
7. DO NOT extract generic references like "the company", "some business"
8. Extract industry/location/notes/status ONLY if explicitly mentioned

**VALID STATUS VALUES** (use ONLY these if user mentions company status):
${statusList}

**STATUS KEYWORDS MAPPING:**
- "client", "customer", "active" → "Active Client"
- "prospect", "potential client" → "Prospect"
- "partner" → "Partner"
- "inactive", "former client" → "Inactive"

OUTPUT: Valid JSON array:

[
  {"name": "Google", "industry": "tech", "location": "Mountain View", "notes": null, "status": null},
  {"name": "Acme Corp", "industry": null, "location": "123 Main St", "notes": "Contract signed", "status": "Active Client"}
]

If NO specific companies mentioned, return []`;

    try {
      const response = await this.canopusService.callModel(
        ModelType.TEXT,
        this.llmModelName,
        {
          prompt: conversationText,
          systemPrompt,
        },
      );

      this.logger.log(
        '[CompanyExtraction] Raw LLM response:',
        response.content,
      );

      const jsonMatch = response.content.match(/\[\s*(\{[\s\S]*?\})?\s*\]/);
      if (!jsonMatch) {
        this.logger.warn('[CompanyExtraction] No JSON array found');
        return [];
      }

      const extractedCompanies = JSON.parse(jsonMatch[0]);
      if (
        !Array.isArray(extractedCompanies) ||
        extractedCompanies.length === 0
      ) {
        return [];
      }

      const processedCompanyIds: number[] = [];

      for (const companyData of extractedCompanies) {
        if (!companyData.name) continue;

        // Check if company already exists
        const existing = await this.prisma.company.findFirst({
          where: {
            userId,
            organizationId,
            name: { equals: companyData.name, mode: 'insensitive' },
          },
        });

        if (existing) {
          // 🔥 UPDATE LOGIC: Merge new data with existing data
          const updateData: any = {};

          if (
            companyData.industry !== undefined &&
            companyData.industry !== null
          ) {
            updateData.industry = companyData.industry;
          }

          if (
            companyData.location !== undefined &&
            companyData.location !== null
          ) {
            updateData.location = companyData.location;
          }

          if (companyData.notes !== undefined && companyData.notes !== null) {
            updateData.notes = companyData.notes;
          }

          if (companyData.status !== undefined && companyData.status !== null) {
            updateData.status = companyData.status;
          }

          // Only update if there's new data
          if (Object.keys(updateData).length > 0) {
            await this.prisma.company.update({
              where: { id: existing.id },
              data: updateData,
            });
            this.logger.log(
              `✅ Company updated: ${existing.name} (ID: ${existing.id}) - Fields: ${Object.keys(updateData).join(', ')}`,
            );
          } else {
            this.logger.debug(
              `Company already exists with no new data: ${companyData.name}`,
            );
          }

          processedCompanyIds.push(existing.id);
          continue;
        }

        // Create new company
        const company = await this.prisma.company.create({
          data: {
            userId,
            organizationId,
            name: companyData.name,
            industry: companyData.industry ?? null,
            location: companyData.location ?? null,
            notes: companyData.notes ?? null,
            status: companyData.status ?? null,
          },
        });

        processedCompanyIds.push(company.id);
        this.logger.log(
          `✅ Company created: ${company.name} (ID: ${company.id})`,
        );
      }

      return processedCompanyIds;
    } catch (error) {
      this.logger.error('Company extraction failed:', error);
      return [];
    }
  }
}
