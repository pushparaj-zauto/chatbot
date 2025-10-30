import { Injectable, Logger } from '@nestjs/common';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { AppConfigService } from 'src/config/app-config.service';

interface IntentResult {
  intent: string;
  confidence: number;
  reasoning?: string;
}

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);
  private llmModelName: string;

  constructor(
    private readonly canopusService: CanopusService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.llmModelName = this.appConfigService.llmModelName;
  }

  async classifyIntent(
    userMessage: string,
    conversationHistory: any[],
  ): Promise<IntentResult> {
    const systemPrompt = `You are an intent classifier for a Personal Assistant chatbot. 
Analyze the user's message and return ONLY ONE intent.

INTENTS:
- event_create: Creating new events/reminders/meetings/appointments
- event_update: Updating/moving/rescheduling/changing existing events
- event_query: Asking about events (show, list, what's on my calendar, free time)
- person_mention: Mentions people with details (name, role, phone, email)
- company_mention: Mentions companies/organizations with details
- general_chat: Normal conversation, questions, no actions

KEYWORDS:
event_create: "remind me", "schedule", "add event", "create", "book", "set reminder"
event_update: "move", "reschedule", "change", "update", "cancel", "postpone"
event_query: "show", "list", "what do I have", "my schedule", "free time", "when is"
person_mention: mentions name + (phone/email/role/company)
company_mention: mentions company + (industry/location/contact)

RULES:
1. If multiple intents detected, pick the STRONGEST one
2. If user asks questions about their schedule → event_query (NO entity extraction needed)
3. If user says "with John" in event creation → event_create (person extracted by that agent)
4. Default to general_chat if unclear

OUTPUT: Return ONLY valid JSON:
{"intent": "event_create", "confidence": 0.95, "reasoning": "User wants reminder"}`;

    const recentHistory = conversationHistory
      .slice(-4)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Recent context:\n${recentHistory}\n\nUser: ${userMessage}\n\nClassify this intent:`;

    try {
      const response = await this.canopusService.callModel(
        ModelType.TEXT,
        this.llmModelName,
        {
          prompt,
          systemPrompt,
        },
      );

      const jsonMatch = response.content.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in LLM response, defaulting to general_chat');
        return { intent: 'general_chat', confidence: 0.5 };
      }

      const result = JSON.parse(jsonMatch[0]) as IntentResult;
      this.logger.log(`Intent: ${result.intent} (${result.confidence})`);
      
      return result;
    } catch (error) {
      this.logger.error('Intent classification failed:', error);
      return { intent: 'general_chat', confidence: 0.5 };
    }
  }
}
