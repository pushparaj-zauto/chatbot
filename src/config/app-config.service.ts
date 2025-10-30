import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  // All config properties as public readonly
  public readonly llmModelName: string;
  public readonly embeddingModelName: string;
  public readonly embeddingDimensions: number;

  // STT Model config
  public readonly sttModelName: string;

  // Canopus configs
  public readonly canopusApiKey: string;
  public readonly canopusApiUrl: string;

   // Milvus configs
  public readonly milvusEndpoints: string;
  public readonly milvusToken: string;
  public readonly chunksCollectionName: string;

  // JWT configs
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly jwtVerificationSecret: string;
  public readonly jwtVerificationExpiresIn: string;
  public readonly jwtPasswordVerificationExpiresIn: string;


  // Environment configs
  public readonly nodeEnv: string;
  public readonly frontendUrl: string;

  // Mail configs
  public readonly mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
    fromAddress: string;
  };

  constructor(private configService: ConfigService) {
    // Load everything once in constructor
    this.llmModelName = this.configService.get('LLM_MODEL_NAME', 'GPT 4.0');
    this.embeddingModelName = this.configService.get('EMBEDDING_MODEL_NAME', 'Text Embedding 3 Large');
    this.embeddingDimensions = parseInt(this.configService.get('EMBEDDING_DIMENSION', '3072'));

    //STT model config with default
    this.sttModelName = this.configService.get('STT_MODEL_NAME', 'GPT-4o Mini Transcribe');

    // Canopus - required configs with null assertion
    this.canopusApiKey = this.configService.get<string>('CANOPUS_API_KEY')!;
    this.canopusApiUrl = this.configService.get<string>('CANOPUS_API_URL')!;
    
    // Milvus - required configs with null assertion
    this.milvusEndpoints = this.configService.get<string>('MILVUS_ENDPOINTS')!;
    this.milvusToken = this.configService.get<string>('MILVUS_TOKEN')!;
    this.chunksCollectionName = this.configService.get('CONVERSATION_CHUNKS_COLLECTION', 'ConversationChunks');
    
    // JWT configs
    this.jwtSecret = this.configService.get('JWT_SECRET')!;
    this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '3d');
    this.jwtVerificationSecret = this.configService.get('JWT_VERIFICATION_SECRET')!;
    this.jwtVerificationExpiresIn = this.configService.get('JWT_VERIFICATION_EXPIRES_IN', '24h');
    this.jwtPasswordVerificationExpiresIn = this.configService.get('JWT_PASSWORD_VERIFICATION_EXPIRES_IN', '1h');
    
    // Environment configs
    this.nodeEnv = this.configService.get('NODE_ENV', 'dev');
    this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    
    // Mail configs
    this.mail = {
      host: this.configService.get('MAIL_HOST')!,
      port: parseInt(this.configService.get('MAIL_PORT', '465')),
      secure: this.configService.get('MAIL_SECURE') === 'true',
      user: this.configService.get('MAIL_USER')!,
      password: this.configService.get('MAIL_PASSWORD')!,
      fromName: this.configService.get('MAIL_FROM_NAME', 'Zauto PA'),
      fromAddress: this.configService.get('MAIL_FROM_ADDRESS')!,
    };
  }
}
