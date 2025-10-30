import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { CanopusService } from 'src/canopus/canopus.service';
import { ModelType } from '@zauto/canopus';
import { v4 as uuidv4 } from 'uuid';
import { getConversationChunksSchema } from './schemas/conversation-chunks.schema';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class ChatbotMilvusService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotMilvusService.name);
  private milvus: MilvusClient;
  private embeddingModelName: string;
  private embeddingDimensions: number;
  private chunksCollectionName: string;
  private conversationChunksSchema: any;

  constructor(
    private readonly canopusService: CanopusService,
    private readonly appConfigService: AppConfigService,
  ) {
    this.embeddingModelName = this.appConfigService.embeddingModelName;
    this.embeddingDimensions = this.appConfigService.embeddingDimensions;
    this.chunksCollectionName = this.appConfigService.chunksCollectionName;

    this.conversationChunksSchema = getConversationChunksSchema(
      this.embeddingDimensions,
      this.chunksCollectionName,
    );
  }

  async onModuleInit() {
    await this.initializeMilvus();
    await this.ensureCollectionExists(
      this.chunksCollectionName,
      this.conversationChunksSchema,
      ['questionEmbedding', 'answerEmbedding'],
    );
  }

  private async initializeMilvus() {
    try {
      if (this.milvus) {
        return;
      }

      this.milvus = new MilvusClient({
        address: this.appConfigService.milvusEndpoints,
        token: this.appConfigService.milvusToken,
        database: 'default',
      });
      this.logger.log('✅ Milvus client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Milvus:', error);
      throw error;
    }
  }

  private async ensureCollectionExists(
    collectionName: string,
    schema: any,
    embeddingFields: string[],
  ) {
    const hasCollection = await this.milvus.hasCollection({
      collection_name: collectionName,
    });

    if (!hasCollection.value) {
      await this.createCollection(collectionName, schema, embeddingFields);
    }

    await this.milvus.loadCollection({
      collection_name: collectionName,
    });
    this.logger.log(`✅ Collection '${collectionName}' ready`);
  }

  private async createCollection(
    collectionName: string,
    schema: any,
    embeddingFields: string[],
  ) {
    await this.milvus.createCollection({
      collection_name: schema.collection_name,
      fields: schema.fields,
    });

    for (const fieldName of embeddingFields) {
      await this.milvus.createIndex({
        collection_name: collectionName,
        field_name: fieldName,
        index_type: schema.index.index_type,
        metric_type: schema.index.metric_type,
      });
    }

    this.logger.log(`✅ Created collection '${collectionName}'`);
  }

  async insertConversationChunk(
    userId: number,
    organizationId: number,
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    normalizedText: string,
    relatedEventIds: number[] = [],
    relatedPersonIds: number[] = [],
    relatedCompanyIds: number[] = [],
    entityExtracted: boolean = false,
    chunkId?: string,
  ): Promise<string> {
    // parallel calls to make response faster
    const [questionEmbeddingResponse, answerEmbeddingResponse] =
      await Promise.all([
        this.canopusService.callModel(
          ModelType.EMBEDDING,
          this.embeddingModelName,
          { content: [userMessage] },
        ),
        this.canopusService.callModel(
          ModelType.EMBEDDING,
          this.embeddingModelName,
          { content: [aiResponse] },
        ),
      ]);

    const questionEmbedding = questionEmbeddingResponse?.content[0];
    const answerEmbedding = answerEmbeddingResponse?.content[0];

    const finalChunkId = chunkId || `${userId}-${sessionId}-${uuidv4()}`;

    await this.milvus.insert({
      collection_name: this.chunksCollectionName,
      data: [
        {
          id: finalChunkId,
          userId,
          organizationId,
          sessionId,
          userMessage,
          aiResponse,
          normalizedText,
          timestamp: Date.now(),
          relatedEventIds,
          relatedPersonIds,
          relatedCompanyIds,
          entityExtracted,
          questionEmbedding,
          answerEmbedding,
        },
      ],
    });

    this.logger.debug(
      `✅ Inserted conversation chunk for session: ${sessionId} with ${relatedEventIds.length} events, ${relatedPersonIds.length} people, ${relatedCompanyIds.length} companies`,
    );

    return finalChunkId;
  }

  async updateChunkEntities(
    chunkId: string,
    relatedEventIds: number[],
    relatedPersonIds: number[],
    relatedCompanyIds: number[],
  ): Promise<void> {
    const existing = await this.milvus.query({
      collection_name: this.chunksCollectionName,
      filter: `id == "${chunkId}"`,
      output_fields: ['*'],
    });

    if (existing.data.length === 0) return;

    await this.milvus.delete({
      collection_name: this.chunksCollectionName,
      filter: `id == "${chunkId}"`,
    });

    const chunk = existing.data[0];
    await this.milvus.insert({
      collection_name: this.chunksCollectionName,
      data: [
        {
          ...chunk,
          relatedEventIds,
          relatedCompanyIds,
          relatedPersonIds,
          entityExtracted: true,
        },
      ],
    });
  }

  async searchSimilarConversations(
    userId: number,
    organizationId: number,
    queryText: string,
    topK: number = 10,
  ): Promise<any[]> {
    const embeddingResponse = await this.canopusService.callModel(
      ModelType.EMBEDDING,
      this.embeddingModelName,
      { content: [queryText] },
    );
    const queryEmbedding = embeddingResponse?.content[0];

    const searchResult = await this.milvus.search({
      collection_name: this.chunksCollectionName,
      vector: queryEmbedding,
      anns_field: 'questionEmbedding',
      filter: `userId == ${userId} && organizationId == ${organizationId}`,
      limit: topK,
      output_fields: [
        'userMessage',
        'aiResponse',
        'normalizedText',
        'timestamp',
        'relatedEventIds',
        'relatedPersonIds',
        'relatedCompanyIds',
      ],
    });

    return searchResult.results.map((result) => ({
      userMessage: result.userMessage,
      aiResponse: result.aiResponse,
      normalizedText: result.normalizedText,
      timestamp: result.timestamp,
      relatedEventIds: result.relatedEventIds || [],
      relatedPersonIds: result.relatedPersonIds || [],
      relatedCompanyIds: result.relatedCompanyIds || [],
      score: result.score,
    }));
  }

  async getAllChunks(
    userId: number,
    organizationId: number,
    limit: number = 50,
  ): Promise<any[]> {
    const queryResult = await this.milvus.query({
      collection_name: this.chunksCollectionName,
      filter: `userId == ${userId} && organizationId == ${organizationId}`,
      output_fields: [
        'id',
        'sessionId',
        'userMessage',
        'aiResponse',
        'normalizedText',
        'timestamp',
        'relatedEventIds',
        'relatedPersonIds',
        'relatedCompanyIds',
      ],
      limit,
    });

    return queryResult.data
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        userMessage: item.userMessage,
        aiResponse: item.aiResponse,
        normalizedText: item.normalizedText,
        timestamp: item.timestamp,
        relatedEventIds: item.relatedEventIds || [],
        relatedPersonIds: item.relatedPersonIds || [],
        relatedCompanyIds: item.relatedCompanyIds || [],
      }));
  }

  async recreateCollection(): Promise<void> {
    try {
      const hasCollection = await this.milvus.hasCollection({
        collection_name: this.chunksCollectionName,
      });
      if (hasCollection.value) {
        await this.milvus.dropCollection({
          collection_name: this.chunksCollectionName,
        });
        this.logger.log(`🗑️ Dropped collection: ${this.chunksCollectionName}`);
      }
    } catch (error) {
      this.logger.error(
        `Error recreating collection ${this.chunksCollectionName}:`,
        error,
      );
    }
    await this.onModuleInit();
  }

  async deleteChunkById(userId: number,organizationId: number, chunkId: string): Promise<void> {
    await this.milvus.delete({
      collection_name: this.chunksCollectionName,
      filter: `userId == ${userId} && organizationId == ${organizationId} && id == "${chunkId}"`,
    });
    this.logger.log(`Deleted chunk ${chunkId} for userId: ${userId}`);
  }

  async deleteAllChunksByUser(userId: number, organizationId: number,): Promise<number> {
    const chunks = await this.milvus.query({
      collection_name: this.chunksCollectionName,
      filter: `userId == ${userId} && organizationId == ${organizationId}`,
      output_fields: ['id'],
      limit: 10000,
    });

    const count = chunks.data.length;

    await this.milvus.delete({
      collection_name: this.chunksCollectionName,
      filter: `userId == ${userId} && organizationId == ${organizationId}`,
    });

    this.logger.log(`Deleted ${count} chunks for userId: ${userId}`);
    return count;
  }
}
