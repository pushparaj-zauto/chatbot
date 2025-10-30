import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { PromptType } from '@prisma/client';

export class UpdateSystemPromptDto {
  @IsString()
  systemPrompt: string;

  @IsOptional()
  @IsEnum(PromptType)
  type?: PromptType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SystemPromptResponseDto {
  systemPrompt: string;
  type: PromptType;
  description?: string;
}
