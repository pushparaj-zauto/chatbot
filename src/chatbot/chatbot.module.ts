import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { CanopusModule } from 'src/canopus/canopus.module';
import { ChatbotMilvusService } from './chatbot-milvus.service';
import { AuthModule } from 'src/auth/auth.module';
import { EventsModule } from 'src/events/events.module';
import { PromptBuilderService } from './services/prompt-builder.service';
import { IntentClassifierService } from './agents/intent-classifier.service';
import { EventCreationAgentService } from './agents/event-creation-agent.service';
import { EventUpdateAgentService } from './agents/event-update-agent.service';
import { PersonAgentService } from './agents/person-agent.service';
import { CompanyAgentService } from './agents/company-agent.service';
import { ConfigurablesModule } from 'src/configurables/configurables.module';


@Module({
  imports: [
    CanopusModule,
    AuthModule,
    EventsModule,
    ConfigurablesModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotMilvusService,
    PromptBuilderService,

    // Coordinator
    IntentClassifierService,
    
    // Specialist Agents
    EventCreationAgentService,
    EventUpdateAgentService,
    PersonAgentService,
    CompanyAgentService,
    
  ],
  exports: [ChatbotService, ChatbotMilvusService],
})
export class ChatbotModule {}
