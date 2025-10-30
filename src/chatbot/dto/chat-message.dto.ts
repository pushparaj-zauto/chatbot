import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  userMessage: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

}

export class ChatResponseDto {
  aiResponse: string;
  contextUsed: number;
}

export class ConversationChunkDto {
  id: string;
  userMessage: string;
  aiResponse: string;
  timestamp: number;
  embedding?: number[];
}

export class GetChunksResponseDto {
  chunks: ConversationChunkDto[];
}
