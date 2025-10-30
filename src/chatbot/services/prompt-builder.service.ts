import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DEFAULT_SYSTEM_PROMPT,
  PromptType,
} from '../config/system-prompt.constant';
import { ConfigurablesService } from 'src/configurables/configurables.service';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configurablesService: ConfigurablesService,
  ) {}

  async buildSystemPrompt(
    userId: number,
    organizationId: number,
    options?: {
      includeEventConflictLogic?: boolean;
    },
  ): Promise<string> {
    const { systemPrompt: baseSystemPrompt } = await this.getSystemPrompt(
      userId,
      organizationId,
      'default',
    );

    // Generate current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const dateContextInstructions = this.buildDateContextInstructions(
      currentDate,
      currentTime,
    );
    const eventFilteringRules = this.buildEventFilteringRules();
    const conflictHandlingRules = options?.includeEventConflictLogic
      ? this.buildEventConflictRules()
      : '';

    const updateInstructions = this.buildEventUpdateInstructions();

    return `${baseSystemPrompt}

${dateContextInstructions}

${eventFilteringRules}

${conflictHandlingRules}

${updateInstructions}`;
  }

  private buildDateContextInstructions(
    currentDate: string,
    currentTime: string,
  ): string {
    return `**IMPORTANT DATE CONTEXT:**
Today is: ${currentDate}
Current time: ${currentTime}

**DATE & TIME INTERPRETATION RULES:**

1. **When user specifies relative dates (today, tonight, this evening, now)**: Use TODAY (${currentDate})

2. **When user says "tomorrow"**: Use tomorrow's exact date

3. **When user gives time WITHOUT date** (e.g., "5 PM", "evening 5 o'clock"):
   - DEFAULT to TODAY unless conversation context clearly suggests otherwise

4. **When user mentions relative time** (e.g., "in half an hour", "in 30 minutes", "after 2 hours"):
   - Calculate from CURRENT TIME (${currentTime})
   - Example: If now is 3:00 PM and user says "in half an hour", the time is 3:30 PM
   - Example: If now is 2:45 PM and user says "meeting in 1.5 hours", the time is 4:15 PM

5. **When processing conversation history**:
   - Calculate actual dates based on when that conversation happened
   - Always verify against database event.eventDate field when available`;
  }

  private buildEventFilteringRules(): string {
    return `**CRITICAL EVENT FILTERING RULES:**
When answering queries about events (today, tomorrow, specific dates):
1. **ONLY return events that match the EXACT date requested**
2. **Prioritize structured database events over conversation history**
   - Database events (with eventDate field) are the PRIMARY source of truth
   - Use conversation chunks ONLY as fallback context if database is empty or for additional details
3. **Cross-check dates carefully**
   - Filter strictly by the requested date
   - Verify eventDate matches what user is asking for
4. **Fallback Strategy**:
   - First: Look for events in the structured database events
   - Second: If database has no results, check conversation history for context
   - Third: If neither has information, inform the user no events were found

**CONTEXT PRIORITY ORDER:**
1. Structured Database Events (eventDate + eventTime) - **HIGHEST PRIORITY**
2. Conversation history - **For context, additional details, and fallback only**
3. When in doubt, filter strictly by requested date and prefer database data

**IMPORTANT**: Database events are authoritative. Conversation chunks help with conversational flow but should NOT override database event information.

Always be smart about relative dates when answering and STRICTLY filter events by their actual eventDate.`;
  }

  private buildEventConflictRules(): string {
    return `

**EVENT CONFLICT & RESCHEDULING RULES:**
When user wants to move/reschedule an event:
1. **Check target date for existing events**:
   - Look at the provided database events for the requested date
   - If events exist on that date, inform the user about potential conflicts
2. **Provide intelligent suggestions**:
   - Example: "I can move your meeting with Giri to October 23rd, but you already have a meeting with Monesh scheduled that day. Would you like me to:
     a) Move it anyway and you can adjust Monesh's meeting later
     b) Suggest an alternative date (October 24th is free)
     c) Check specific time slots on October 23rd"
3. **Time-based conflict detection**:
   - If both events have specific times (eventTime), check for overlaps
   - If times don't conflict (e.g., one at 10 AM, another at 4 PM), mention both can coexist
4. **Be conversational and helpful**:
   - Don't just block the action - offer solutions
   - Use context from conversation history to understand user preferences
5. **Confirm before making changes**:
   - Always get user confirmation before modifying events
   - Clearly state what will be changed

**Example Dialogue:**
User: "move the Giri meeting to tomorrow"
You: "I can move your meeting with Giri (currently October 22nd at 4:00 PM) to tomorrow (October 23rd). However, you already have a meeting with Monesh scheduled for October 23rd (no specific time set). Would you like me to move it anyway, or would you prefer a different date?"`;
  }

  private async getSystemPrompt(
    userId: number,
    organizationId: number,
    type?: string,
  ): Promise<{ systemPrompt: string }> {
    const promptType = (type as PromptType) || PromptType.default;
    try {
      const prompt = await this.prisma.prompt.findUnique({
        where: {
          organizationId_userId_type: {
            organizationId,
            userId,
            type: promptType,
          },
        },
      });

      if (prompt) {
        return { systemPrompt: prompt.promptString };
      }

      return { systemPrompt: DEFAULT_SYSTEM_PROMPT };
    } catch (error) {
      this.logger.error('Error fetching system prompt:', error);
      return { systemPrompt: DEFAULT_SYSTEM_PROMPT };
    }
  }

  private buildEventUpdateInstructions(): string {
    return `
**EVENT UPDATE INSTRUCTIONS:**

When user wants to update/move/reschedule an event:
1. **Identify the event ID from the context**:
   - Look for [Event ID: X] in the database events
   - Look for [Related Event IDs: X, Y] in conversation history
   
2. **In your response, mention the event ID**:
   - Example: "I will update event #75 (Meeting with Monesh) to tomorrow"
   - This helps the extraction agent know which event to update
   
3. **If multiple events match, ask for clarification**:
   - Example: "I see two meetings - #75 (Meeting with Monesh at 4 PM) and #80 (Call with Monesh at 6 PM). Which one would you like to move?"
`;
  }
}
