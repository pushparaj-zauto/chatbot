import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { AppConfigService } from 'src/config/app-config.service';



@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async ( appConfigService: AppConfigService ) => ({
        global: true,
        secret: appConfigService.jwtSecret,
        signOptions: {
          expiresIn: appConfigService.jwtExpiresIn,
        }
      }),
      inject: [ AppConfigService ]
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService ],
  exports: [ AuthService, JwtModule ],
})
export class AuthModule {}
