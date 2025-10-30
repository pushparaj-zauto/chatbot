import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private appConfig: AppConfigService,
  ) {}

  async sendUserVerification(name: string, email: string, token: string) {
    const verificationUrl = `${this.appConfig?.frontendUrl}/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Account',
      template: './verification',
      context: {
        name,
        verificationUrl,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Our Platform!',
      template: './welcome',
      context: {
        name,
        loginUrl: `${this.appConfig?.frontendUrl}/login`,
      },
    });
  }

  async sendPasswordResetEmail(name: string, email: string, token: string) {
    const resetUrl = `${this.appConfig?.frontendUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
      template: './password-reset',
      context: {
        name,
        resetUrl,
      },
    });
  }

  async sendPasswordChangedEmail(email: string, name: string) {
  await this.mailerService.sendMail({
    to: email,
    subject: 'Password Successfully Changed',
    template: './password-changed',
    context: {
      name,
      loginUrl: `${this.appConfig?.frontendUrl}/login`,
    },
  });
}

}
