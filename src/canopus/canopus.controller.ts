import { Controller, Get, Post, Body, Query, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CanopusService } from './canopus.service';
import { ModelType } from '@zauto/canopus';
import type { Express } from 'express';


@Controller('canopus')
export class CanopusController {    
  constructor(private readonly canopusService: CanopusService) {}

  @Get('models')
  async getModels(@Query('type') type?: string) {
    const upperType = type?.toUpperCase() as ModelType;
    if (type && !Object.values(ModelType).includes(upperType)) {
      throw new BadRequestException(`Invalid model type: ${type}`);
    }
    return this.canopusService.listModels(upperType);
  }

  // Endpoint for file uploads (STT, TTS)
  @Post('call/file')
  @UseInterceptors(FileInterceptor('file'))
  async callModelWithFile(
    @Body() body: {
      type: string;
      modelId: string;
      languageCode?: string;
      targetLanguageCode?: any;
      speaker?: any;
    },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const type = body.type?.toUpperCase() as ModelType;

    if (!Object.values(ModelType).includes(type)) {
      throw new BadRequestException(`Invalid model type: ${body.type}`);
    }

    if (!file) {
      throw new BadRequestException('File is required for this endpoint');
    }

    return this.canopusService.callModel(type, body.modelId, {
      fileBuffer: file.buffer,
      languageCode: body.languageCode,
      targetLanguageCode: body.targetLanguageCode,
      speaker: body.speaker,
    });
  }

  // Endpoint for JSON requests (TEXT, EMBEDDING)
  @Post('call')
  async callModel(
    @Body() body: {
      type: string;
      modelId: string;
      prompt?: string;
      chatHistory?: any[];
      text?: string;
      content?: string | string[];
      languageCode?: string;
      targetLanguageCode?: any;
      speaker?: any;
    },
  ) {
    const type = body.type?.toUpperCase() as ModelType;

    if (!Object.values(ModelType).includes(type)) {
      throw new BadRequestException(`Invalid model type: ${body.type}`);
    }

    // Convert content to array if it's a string (for EMBEDDING type)
    const payload = {
      ...body,
      content: body.content 
        ? (Array.isArray(body.content) ? body.content : [body.content])
        : undefined,
    };

    return this.canopusService.callModel(type, body.modelId, payload);
  }
}

