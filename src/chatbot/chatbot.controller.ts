import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import {
  SendMessageDto,
  ChatResponseDto,
  GetChunksResponseDto,
} from './dto/chat-message.dto';
import {
  UpdateSystemPromptDto,
  SystemPromptResponseDto,
} from './dto/system-prompt.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentOrgId,
} from 'src/auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body(ValidationPipe) dto: SendMessageDto,
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
  ): Promise<ChatResponseDto & { sessionId: string }> {
    return this.chatbotService.sendMessage(
      userId,
      organizationId,
      dto.userMessage,
      dto.sessionId,
    );
  }

  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
  ): Promise<any> {
    return this.chatbotService.getSessionHistory(
      userId,
      organizationId,
      sessionId,
    );
  }

  @Get('chunks')
  @UseGuards(JwtAuthGuard)
  async getChunks(
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<GetChunksResponseDto> {
    return this.chatbotService.getChunks(
      userId,
      organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('system-prompt')
  @UseGuards(JwtAuthGuard)
  async getSystemPrompt(
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
    @Query('type') type?: string,
  ): Promise<SystemPromptResponseDto> {
    return this.chatbotService.getSystemPrompt(userId, organizationId, type);
  }

  @Post('system-prompt')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateSystemPrompt(
    @Body(ValidationPipe) dto: UpdateSystemPromptDto,
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.chatbotService.updateSystemPrompt(
      dto.systemPrompt,
      userId,
      organizationId,
      dto.type,
      dto.description,
    );
  }

  @Post('recreate-collection')
  async recreateCollection(): Promise<{ message: string }> {
    await this.chatbotService.recreateCollection();
    return { message: 'Collection recreated successfully' };
  }

  @Delete('chunks/:chunkId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteChunk(
    @Param('chunkId') chunkId: string,
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.chatbotService.deleteChunk(userId, organizationId, chunkId);
  }

  @Delete('chunks')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAllChunks(
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
  ): Promise<{ success: boolean; message: string; deletedCount: number }> {
    return this.chatbotService.deleteAllChunks(userId, organizationId);
  }

  @Post('transcribe')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('audio'))
  @HttpCode(HttpStatus.OK)
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: number,
  ): Promise<{ transcription: string }> {
    return this.chatbotService.transcribeAudio(file.buffer);
  }
}
