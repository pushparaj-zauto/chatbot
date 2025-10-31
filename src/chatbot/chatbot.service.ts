import { Injectable, Logger } from '@nestjs/common';
import { ChatbotMilvusService } from './chatbot-milvus.service';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { DEFAULT_SYSTEM_PROMPT } from './config/system-prompt.constant';
import { ChatResponseDto, GetChunksResponseDto } from './dto/chat-message.dto';
import { SystemPromptResponseDto } from './dto/system-prompt.dto';
import { AppConfigService } from 'src/config/app-config.service';
import { PromptType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { v4 as uuidv4 } from 'uuid';
import { IntentClassifierService } from './agents/intent-classifier.service';
import { PersonAgentService } from './agents/person-agent.service';
import { CompanyAgentService } from './agents/company-agent.service';
import { EventCreationAgentService } from './agents/event-creation-agent.service';
import { EventUpdateAgentService } from './agents/event-update-agent.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private llmModelName: string;
  private sttModelName: string;
  private readonly SESSION_TIMEOUT_MINUTES = 30;

  constructor(
    private readonly milvusService: ChatbotMilvusService,
    private readonly canopusService: CanopusService,
    private readonly appConfigService: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly intentClassifier: IntentClassifierService,

    private readonly personAgent: PersonAgentService,
    private readonly companyAgent: CompanyAgentService,
    private readonly eventCreationAgent: EventCreationAgentService,
    private readonly eventUpdateAgent: EventUpdateAgentService,
  ) {
    this.llmModelName = this.appConfigService.llmModelName;
    this.sttModelName = this.appConfigService.sttModelName;
  }

  async sendMessage(
    userId: number,
    organizationId: number,
    userMessage: string,
    sessionId?: string,
  ): Promise<ChatResponseDto & { sessionId: string }> {
    this.logger.log(
      `Processing message for userId: ${userId}, sessionId: ${sessionId}`,
    );

    // 1. Normalize user message
    let normalizedUserMessage = userMessage;
    try {
      normalizedUserMessage = await this.normalizeDatesWithLLM(userMessage);
      this.logger.debug('User message date normalization successful');
    } catch (error) {
      this.logger.warn(
        'User message Date normalization failed, using original:',
        error.message,
      );
    }

    // 2. Session management
    let session = await this.getOrCreateSession(
      userId,
      organizationId,
      sessionId,
    );

    // 3. Store user message
    await this.prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: userMessage,
      },
    });

    // 4. Get conversation history
    const messages = await this.prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const conversationHistory = messages.reverse();

    // 5. Build system prompt
    const systemPrompt = await this.promptBuilderService.buildSystemPrompt(
      userId,
      organizationId,
      {
        includeEventConflictLogic: true,
      },
    );

    // 6. Search context
    let relevantContext: any[] = [];
    try {
      relevantContext = await this.milvusService.searchSimilarConversations(
        userId,
        organizationId,
        normalizedUserMessage,
        10,
      );
    } catch (error) {
      this.logger.warn('Milvus search failed, continuing without context');
      relevantContext = [];
    }

    // 7. Fetch DB events
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const upcomingEvents = await this.prisma.event.findMany({
      where: {
        userId,
        organizationId,
        eventDate: { gte: startOfToday },
      },
      orderBy: { eventDate: 'asc' },
      take: 20,
      include: {
        people: { include: { person: true } },
        companies: { include: { company: true } },
      },
    });

    // 8. Build context
    let contextStr = this.buildContextString(upcomingEvents, relevantContext);

    // System prompt + context separation
    const systemPromptWithContext = `${systemPrompt}
    
    ${contextStr}`;

    const chatHistory = conversationHistory.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 9. Get AI response
    const llmResponse = await this.canopusService.callModel(
      ModelType.TEXT,
      this.llmModelName,
      {
        prompt: userMessage,
        chatHistory: chatHistory,
        systemPrompt: systemPromptWithContext,
      },
    );

    const aiResponse =
      llmResponse.content || 'Sorry, I could not generate a response.';

    // 10. Store assistant message
    await this.prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    // 11. Update session
    session = await this.prisma.conversationSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    // RETURN IMMEDIATELY - User sees response now - Do Heavy tasks as async
    this.logger.log(
      `Response generated with ${relevantContext.length} context chunks`,
    );

    const response = {
      sessionId: session.id,
      aiResponse,
      contextUsed: relevantContext.length,
    };

    //DO HEAVY WORK ASYNC (Fire and forget)
    this.processAgentTasksAsync(
      userId,
      organizationId,
      session.id,
      userMessage,
      normalizedUserMessage,
      aiResponse,
      conversationHistory,
    ).catch((error) => {
      this.logger.error('Async chunk storage failed:', error);
    });

    return response;
  }
  private async processAgentTasksAsync(
    userId: number,
    organizationId: number,
    sessionId: string,
    userMessage: string,
    normalizedUserMessage: string,
    aiResponse: string,
    conversationHistory: any[],
  ): Promise<void> {
    try {
      const chunkId = `${userId}-${uuidv4()}`;

      // Classify intent first
      // const { intent, confidence } = await this.intentClassifier.classifyIntent(
      //   userMessage,
      //   conversationHistory,
      // );

      // this.logger.log(`Intent: ${intent} (confidence: ${confidence})`);

      // Normalize dates for Milvus chunk
      const normalizedAiResponse = await this.normalizeDatesWithLLM(aiResponse);

      // Fetch DB context for agents
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentEvents = await this.prisma.event.findMany({
        where: {
          userId,
          organizationId,
          eventDate: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          people: { include: { person: true } },
          companies: { include: { company: true } },
        },
      });

      // Build context
      const recentHistory = conversationHistory
        .slice(-4)
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');

      // SEQUENTIAL EXECUTION
      const allEventIds: number[] = [];
      const allPersonIds: number[] = [];
      const allCompanyIds: number[] = [];

      // STEP 1: Extract people FIRST
      this.logger.debug('🔹 Step 1: Extracting people...');
      const personIds = await this.personAgent.extractAndCreatePeople(
        userId,
        organizationId,
        sessionId,
        userMessage,
        aiResponse,
        recentHistory,
      );
      allPersonIds.push(...personIds);
      this.logger.log(`✅ Extracted ${personIds.length} people: ${personIds}`);

      // STEP 2: Extract companies SECOND
      this.logger.debug('🔹 Step 2: Extracting companies...');
      const companyIds = await this.companyAgent.extractAndCreateCompanies(
        userId,
        organizationId,
        sessionId,
        userMessage,
        aiResponse,
        recentHistory,
      );
      allCompanyIds.push(...companyIds);
      this.logger.log(
        `✅ Extracted ${companyIds.length} companies: ${companyIds}`,
      );

      // STEP 3: Create events (with people/company linking)
      this.logger.debug('🔹 Step 3: Creating events...');
      const createdEventIds =
        await this.eventCreationAgent.extractAndCreateEvents(
          userId,
          organizationId,
          sessionId,
          userMessage,
          aiResponse,
          recentHistory,
          recentEvents,
          allPersonIds, // 🔥 PASS extracted person IDs
          allCompanyIds, // 🔥 PASS extracted company IDs
        );
      allEventIds.push(...createdEventIds);
      this.logger.log(
        `✅ Created ${createdEventIds.length} events: ${createdEventIds}`,
      );

      // STEP 4: Update events (with people/company linking)
      this.logger.debug('🔹 Step 4: Updating events...');
      const updatedEventIds =
        await this.eventUpdateAgent.extractAndUpdateEvents(
          userId,
          organizationId,
          sessionId,
          userMessage,
          aiResponse,
          recentHistory,
          recentEvents,
          allPersonIds,
          allCompanyIds,
        );
      allEventIds.push(...updatedEventIds);
      this.logger.log(
        `✅ Updated ${updatedEventIds.length} events: ${updatedEventIds}`,
      );

      // 🔥 INSERT CHUNK TO MILVUS ONCE WITH ALL IDS
      const uniqueEventIds = [...new Set(allEventIds)];
      const uniquePersonIds = [...new Set(allPersonIds)];
      const uniqueCompanyIds = [...new Set(allCompanyIds)];

      // Insert chunk to Milvus first
      await this.milvusService.insertConversationChunk(
        userId,
        organizationId,
        sessionId,
        normalizedUserMessage,
        normalizedAiResponse,
        `${normalizedUserMessage}\n${normalizedAiResponse}`,
        uniqueEventIds,
        uniquePersonIds,
        uniqueCompanyIds,
        true,
        chunkId,
      );

      this.logger.log(
        `✅ Chunk stored in Milvus: ${uniqueEventIds.length} events, ${uniquePersonIds.length} people, ${uniqueCompanyIds.length} companies`,
      );

      this.logger.debug('All agent tasks queued');
    } catch (error) {
      this.logger.error('Agent task processing failed:', error);
      throw error;
    }
  }

  private buildContextString(
    upcomingEvents: any[],
    relevantContext: any[],
  ): string {
    let contextStr = '';

    if (upcomingEvents.length > 0) {
      contextStr += '=== Your Upcoming Events (Database) ===\n';
      contextStr += upcomingEvents
        .map((e) => {
          const people = e.people.map((ep) => ep.person.name).join(', ');
          const companies = e.companies.map((ec) => ec.company.name).join(', ');
          return `[Event ID: ${e.id}] Date: ${e.eventDate?.toISOString().split('T')[0] ?? 'No date'}, Time: ${e.eventTime ?? 'No time'}, Title: ${e.title}${people ? `, People: ${people}` : ''}${companies ? `, Companies: ${companies}` : ''}`;
        })
        .join('\n');
      contextStr += '\n\n';
    }

    if (relevantContext.length > 0) {
      contextStr += '=== Relevant Previous Conversations ===\n';
      contextStr += relevantContext
        .map((ctx) => {
          //ADD EVENT IDS FROM CHUNKS
          const eventIdsStr =
            ctx.relatedEventIds?.length > 0
              ? `[Related Event IDs: ${ctx.relatedEventIds.join(', ')}] `
              : '';
          return `${eventIdsStr}USER: ${ctx.userMessage}\nASSISTANT: ${ctx.aiResponse}`;
        })
        .join('\n\n');
    }

    return contextStr || 'No previous conversation history available.';
  }

  private async normalizeDatesWithLLM(text: string): Promise<string> {
    const today = new Date();

    const systemInstructions = `Current date: ${today.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}

**Task:** Rewrite text by converting relative dates to absolute dates.

**Rules:**
- "today" → ${today.toISOString().split('T')[0]}
- "tomorrow" → ${new Date(today.getTime() + 86400000).toISOString().split('T')[0]}
- "tonight", "this evening" → ${today.toISOString().split('T')[0]}
- "next monday", "this friday" → Calculate exact date
- "in 3 days" → Calculate exact date
- Keep absolute dates (YYYY-MM-DD) unchanged

Return ONLY the normalized text, nothing else.`;

    const llmResponse = await this.canopusService.callModel(
      ModelType.TEXT,
      this.llmModelName,
      {
        prompt: text,
        systemPrompt: systemInstructions,
      },
    );

    return llmResponse.content.trim();
  }

  private async getOrCreateSession(
    userId: number,
    organizationId: number,
    sessionId?: string,
  ): Promise<any> {
    if (sessionId) {
      const session = await this.prisma.conversationSession.findFirst({
        where: {
          id: sessionId,
          userId,
          organizationId,
        },
      });

      if (session) {
        const timeoutThreshold = new Date(
          Date.now() - this.SESSION_TIMEOUT_MINUTES * 60 * 1000,
        );

        if (session.isActive && session.lastActiveAt > timeoutThreshold) {
          return session;
        }
      }
    }

    // Find or create active session
    const timeoutThreshold = new Date(
      Date.now() - this.SESSION_TIMEOUT_MINUTES * 60 * 1000,
    );

    let activeSession = await this.prisma.conversationSession.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true,
        lastActiveAt: {
          gte: timeoutThreshold,
        },
      },
    });

    if (!activeSession) {
      activeSession = await this.prisma.conversationSession.create({
        data: {
          userId,
          organizationId,
          isActive: true,
          lastActiveAt: new Date(),
        },
      });
      this.logger.log(
        `Created new session: ${activeSession.id} for userId: ${userId}`,
      );
    }

    return activeSession;
  }

  async getSessionHistory(
    userId: number,
    organizationId: number,
    sessionId: string,
  ): Promise<any> {
    const session = await this.prisma.conversationSession.findFirst({
      where: {
        id: sessionId,
        userId,
        organizationId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return {
        isActive: false,
        messages: [],
      };
    }

    const timeoutThreshold = new Date(
      Date.now() - this.SESSION_TIMEOUT_MINUTES * 60 * 1000,
    );

    const isStillActive =
      session.isActive && session.lastActiveAt > timeoutThreshold;

    return {
      sessionId: session.id,
      isActive: isStillActive,
      messages: session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    };
  }

  async getChunks(
    userId: number,
    organizationId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<GetChunksResponseDto> {
    const skip = (page - 1) * limit;

    const allChunks = await this.milvusService.getAllChunks(
      userId,
      organizationId,
      1000, // Get all chunks for counting
    );

    const total = allChunks.length;
    const totalPages = Math.ceil(total / limit);
    const chunks = allChunks.slice(skip, skip + limit);

    return {
      chunks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getSystemPrompt(
    userId: number,
    organizationId: number,
    type?: string,
  ): Promise<SystemPromptResponseDto> {
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
        return {
          systemPrompt: prompt.promptString,
          type: prompt.type,
          description: prompt.description || undefined,
        };
      }

      return {
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        type: PromptType.default,
        description: 'Default system prompt',
      };
    } catch (error) {
      this.logger.error('Error fetching system prompt:', error);
      return {
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        type: PromptType.default,
        description: 'Default system prompt',
      };
    }
  }

  async updateSystemPrompt(
    prompt: string,
    userId: number,
    organizationId: number,
    type?: PromptType,
    description?: string,
  ): Promise<{ success: boolean; message: string }> {
    const promptType = type || PromptType.default;
    try {
      await this.prisma.prompt.upsert({
        where: {
          organizationId_userId_type: {
            organizationId,
            userId,
            type: promptType,
          },
        },
        update: {
          promptString: prompt,
          description: description,
        },
        create: {
          userId,
          type: promptType,
          promptString: prompt,
          description,
          organizationId,
        },
      });

      this.logger.log(
        `System prompt (${promptType}) updated for userId: ${userId}`,
      );
      return {
        success: true,
        message: 'System prompt updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating system prompt:', error);
      return {
        success: false,
        message: 'Failed to update system prompt',
      };
    }
  }

  async recreateCollection(): Promise<void> {
    return this.milvusService.recreateCollection();
  }

  async deleteChunk(
    userId: number,
    organizationId: number,
    chunkId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting chunk ${chunkId} for userId: ${userId}`);
    try {
      await this.milvusService.deleteChunkById(userId, organizationId, chunkId);
      return {
        success: true,
        message: 'Chunk deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete chunk ${chunkId}:`, error);
      return {
        success: false,
        message: 'Failed to delete chunk',
      };
    }
  }

  async deleteAllChunks(
    userId: number,
    organizationId: number,
  ): Promise<{ success: boolean; message: string; deletedCount: number }> {
    this.logger.log(`Deleting all chunks for userId: ${userId}`);
    try {
      // Delete chunks
      const deletedChunksCount = await this.milvusService.deleteAllChunksByUser(
        userId,
        organizationId,
      );

      this.logger.log(`Deleted ${deletedChunksCount} chunks`);

      return {
        success: true,
        message: `Deleted ${deletedChunksCount} chunks`,
        deletedCount: deletedChunksCount,
      };
    } catch (error) {
      this.logger.error(`Failed to delete all chunks:`, error);
      return {
        success: false,
        message: 'Failed to delete chunks',
        deletedCount: 0,
      };
    }
  }

  async transcribeAudio(
    audioBuffer: Buffer,
  ): Promise<{ transcription: string }> {
    this.logger.log('Transcribing audio...');

    const sttResult = await this.canopusService.callModel(
      ModelType.STT,
      this.sttModelName,
      {
        fileBuffer: audioBuffer,
        prompt: 'Understand the context and translate accurately to English',
      },
    );

    return { transcription: sttResult.transcription };
  }
}
