import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { AppConfigService } from 'src/config/app-config.service';


@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (appConfig: AppConfigService) => {
         return {
            transport: {
              host: appConfig.mail.host,
              port: appConfig.mail.port,
              secure: appConfig.mail.secure,
              auth: {
                user: appConfig.mail.user,
                pass: appConfig.mail.password
              }
            },
            defaults: {
              from: `"${appConfig.mail.fromName}" <${appConfig.mail.fromAddress}>`
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true
              },
            },
         };
      },
      inject: [AppConfigService],
    }),

  ],
  providers: [MailService],
  exports: [ MailService ]  
})
export class MailModule {}
