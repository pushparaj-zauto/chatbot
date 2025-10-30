import { BadRequestException, Injectable } from '@nestjs/common';
import { Canopus, ModelType } from '@zauto/canopus';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class CanopusService {
  private canopus: Canopus;

  constructor(private appConfigService: AppConfigService) {
    const apiKey = this.appConfigService.canopusApiKey;
    const apiUrl = this.appConfigService.canopusApiUrl;

    this.canopus = new Canopus({
      apiKey,
      link: apiUrl,
    });
  }

  async listModels(type?: ModelType) {
    const result = await this.canopus.getModels(type);
    return result?.data;
  }

  async callModel(
    type: ModelType,
    modelId: string,
    payload: {
      prompt?: string;
      chatHistory?: any[];
      systemPrompt?: string,
      text?: string;
      content?: string[];
      languageCode?: string;
      targetLanguageCode?: any;
      speaker?: any;
      fileBuffer?: Buffer;
    },
  ) {
    switch (type) {
      case ModelType.TEXT:
        const textResult = await this.canopus.callTextModels(
          modelId,
          payload.prompt!,
          payload.chatHistory,
          payload.systemPrompt,
        );
        return textResult?.data;

      case ModelType.TTS:
        const ttsResult = await this.canopus.callTtsModel(
          modelId,
          payload.text!,
          payload.targetLanguageCode!,
          payload.speaker,
        );

        // extract base 64 audio
        const base64Audio = ttsResult?.data?.data ;

        if(base64Audio){
          const outputDir = path.join(__dirname, '..', 'output');
          fs.mkdirSync(outputDir, { recursive: true });

          const filename = `tts-output-${Date.now()}.wav`;
          const filepath = path.join(__dirname, '..', 'output', filename);

          const audioBuffer = Buffer.from(base64Audio, 'base64');

          fs.writeFileSync(filepath, audioBuffer);

          console.log(`TTS audio saved to ${filepath}`);
        }

        return ttsResult?.data;

      case ModelType.STT:
        if (!payload.fileBuffer) {
          throw new BadRequestException('fileBuffer is required for STT model');
        }
        const tmpFilePath = path.join(
          __dirname,
          'tmpfile-' + Date.now() + '.wav',
        );
        fs.writeFileSync(tmpFilePath, payload?.fileBuffer);
        const sttRaw = await this.canopus.callSttModel(
          modelId,
          tmpFilePath,
          payload.prompt,
          payload.languageCode as any,
        );
        fs.unlinkSync(tmpFilePath);
        return sttRaw?.data;

      case ModelType.EMBEDDING:
        const embeddingResult = await this.canopus.callEmbeddingModel(
          modelId,
          payload.content!,
        );
        return embeddingResult?.data;
    }
  }
}
