import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CanopusModule } from './canopus/canopus.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { PersonsModule } from './persons/persons.module';
import { CompaniesModule } from './companies/companies.module';
import { ConfigurablesModule } from './configurables/configurables.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AppConfigModule,
    PrismaModule,
    CanopusModule,
    ChatbotModule,
    AuthModule,
    MailModule,
    EventsModule,
    PersonsModule,
    CompaniesModule,
    ConfigurablesModule,
    BootstrapModule,
    TeamModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
