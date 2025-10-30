import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { DEFAULT_SYSTEM_PROMPT } from 'src/chatbot/config/system-prompt.constant';
import { MailService } from 'src/mail/mail.service';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private appConfig: AppConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  private generateVerificationToken(userId: number, email: string): string {
    return this.jwtService.sign(
      { email, sub: userId, type: 'verification' },
      {
        secret: this.appConfig.jwtVerificationSecret,
        expiresIn: this.appConfig.jwtVerificationExpiresIn,
      },
    );
  }

  private generatePasswordResetToken(userId: number, email: string): string {
    return this.jwtService.sign(
      { email, sub: userId, type: 'password_reset' },
      {
        secret: this.appConfig.jwtVerificationSecret,
        expiresIn: this.appConfig.jwtPasswordVerificationExpiresIn,
      },
    );
  }

  // async signup(signupDto: SignupDto) {
  //   const { email, password, name } = signupDto;

  //   // check if user exists
  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (existingUser) {
  //     throw new ConflictException('user exists');
  //   }

  //   const hashedPassword = await this.hashPassword(password);

  //   // create user and set default prompt
  //   const user = await this.prisma.user.create({
  //     data: {
  //       name,
  //       email,
  //       password: hashedPassword,
  //       status: 'registered',
  //       prompts: {
  //         create: {
  //           type: 'default',
  //           description: 'Default system prompt',
  //           promptString: DEFAULT_SYSTEM_PROMPT,
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       email: true,
  //       name: true,
  //       status: true,
  //       isVerified: true,
  //       createdAt: true,
  //       prompts: {
  //         select: {
  //           id: true,
  //           type: true,
  //           description: true,
  //         },
  //       },
  //     },
  //   });

  //   const verificationToken = this.generateVerificationToken(
  //     user.id,
  //     user.email,
  //   );
  //   const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  //   // Update user with the token
  //   await this.prisma.user.update({
  //     where: { id: user.id },
  //     data: {
  //       verificationToken,
  //       verificationTokenExpiry: tokenExpiry,
  //     },
  //   });

  //   // send verification email
  //   try {
  //     await this.mailService.sendUserVerification(
  //       user.name,
  //       user.email,
  //       verificationToken,
  //     );
  //   } catch (error) {
  //     console.error('Failed to send verification email:', error);
  //   }

  //   return {
  //     message: 'Signup successful. Please check your email to verify.',
  //     user,
  //   };
  // }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'LOGIN_FAILED',
        message: 'Invalid Credentials',
      });
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'LOGIN_FAILED',
        message: 'Invalid Credentials',
      });
    }

    if (user.status !== 'active') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'ACCOUNT_INACTIVE',
        message: 'Your account is inactive',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
      },
    };
  }

  // async verifyEmail(token: string) {
  //   try {
  //     const payload = this.jwtService.verify(token, {
  //       secret: this.appConfig.jwtVerificationSecret,
  //     });

  //     if (payload.type !== 'verification') {
  //       throw new BadRequestException('Invalid verification token');
  //     }

  //     const user = await this.prisma.user.findUnique({
  //       where: { id: payload.sub },
  //       select: { isVerified: true, emailVerifiedAt: true, name: true },
  //     });

  //     if (!user) {
  //       throw new BadRequestException('User not found');
  //     }

  //     //User already verified
  //     if (user.isVerified && user.emailVerifiedAt) {
  //       return {
  //         message: 'Your email is already verified. You can log in.',
  //         alreadyVerified: true,
  //         success: true,
  //       };
  //     }

  //     // First-time verification
  //     await this.prisma.user.update({
  //       where: { id: payload.sub },
  //       data: {
  //         isVerified: true,
  //         status: 'active',
  //         emailVerifiedAt: new Date(),
  //         verificationToken: null,
  //         verificationTokenExpiry: null,
  //       },
  //     });

  //     // Send welcome email
  //     try {
  //       await this.mailService.sendWelcomeEmail(payload.email, user.name);
  //     } catch (error) {
  //       console.error('Failed to send welcome email:', error);
  //     }

  //     return {
  //       message: 'Email verified successfully',
  //       alreadyVerified: false,
  //       success: true,
  //     };
  //   } catch (error) {
  //     if (error.name === 'TokenExpiredError') {
  //       throw new BadRequestException({
  //         statusCode: 400,
  //         error: 'TOKEN_EXPIRED',
  //         message: 'Verification link has expired',
  //       });
  //     }
  //     throw new BadRequestException('Invalid or expired verification token');
  //   }
  // }

  // async resendVerificationEmail(email: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email },
  //     select: {
  //       id: true,
  //       name: true,
  //       email: true,
  //       isVerified: true,
  //       verificationTokenExpiry: true,
  //     },
  //   });

  //   if (!user) {
  //     // Security: Don't reveal if user exists
  //     return {
  //       message: 'a verification email has been sent.',
  //     };
  //   }

  //   if (user.isVerified) {
  //     throw new BadRequestException('Email is already verified');
  //   }

  //   // Generate new token
  //   const verificationToken = this.generateVerificationToken(
  //     user.id,
  //     user.email,
  //   );
  //   const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  //   await this.prisma.user.update({
  //     where: { id: user.id },
  //     data: {
  //       verificationToken,
  //       verificationTokenExpiry: tokenExpiry,
  //     },
  //   });

  //   try {
  //     await this.mailService.sendUserVerification(
  //       user.name,
  //       user.email,
  //       verificationToken,
  //     );
  //   } catch (error) {
  //     console.error('Failed to resend verification email:', error);
  //     throw new BadRequestException('Failed to send verification email');
  //   }

  //   return {
  //     message: 'Verification email sent successfully',
  //     success: true,
  //   };
  // }

  // async forgotPassword(email: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email },
  //     select: { id: true, name: true, email: true, isVerified: true },
  //   });

  //   // Don't reveal if user exists
  //   if (!user) {
  //     return {
  //       message: 'A password reset link has been sent.',
  //     };
  //   }

  //   if (!user.isVerified) {
  //     throw new BadRequestException('Please verify your email first');
  //   }

  //   const resetToken = this.generatePasswordResetToken(user.id, user.email);
  //   const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  //   await this.prisma.user.update({
  //     where: { id: user.id },
  //     data: {
  //       passwordResetToken: resetToken,
  //       passwordResetExpires: resetExpiry,
  //       passwordResetRequestedAt: new Date(),
  //     },
  //   });

  //   try {
  //     await this.mailService.sendPasswordResetEmail(
  //       user.name,
  //       user.email,
  //       resetToken,
  //     );
  //   } catch (error) {
  //     console.error('Failed to send password reset email:', error);
  //     throw new BadRequestException('Failed to send password reset email');
  //   }

  //   return {
  //     message: 'Password reset link sent to your email',
  //     success: true,
  //   };
  // }

  // async resetPassword(token: string, newPassword: string) {
  //   try {
  //     const payload = this.jwtService.verify(token, {
  //       secret: this.appConfig.jwtVerificationSecret,
  //     });

  //     if (payload.type !== 'password_reset') {
  //       throw new BadRequestException('Invalid reset token');
  //     }

  //     const user = await this.prisma.user.findUnique({
  //       where: { id: payload.sub },
  //       select: {
  //         id: true,
  //         email: true,
  //         name: true,
  //         passwordResetToken: true,
  //         passwordResetExpires: true,
  //       },
  //     });

  //     if (!user || user.passwordResetToken !== token) {
  //       throw new BadRequestException('Invalid or expired reset token');
  //     }

  //     if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
  //       throw new BadRequestException({
  //         statusCode: 400,
  //         error: 'TOKEN_EXPIRED',
  //         message: 'Password reset link has expired',
  //       });
  //     }

  //     const hashedPassword = await this.hashPassword(newPassword);

  //     await this.prisma.user.update({
  //       where: { id: user.id },
  //       data: {
  //         password: hashedPassword,
  //         passwordResetToken: null,
  //         passwordResetExpires: null,
  //         passwordResetRequestedAt: null,
  //       },
  //     });

  //     try {
  //       await this.mailService.sendPasswordChangedEmail(user.email, user.name);
  //     } catch (error) {
  //       console.error('Failed to send password changed email', error);
  //     }

  //     return {
  //       message: 'Password reset successful',
  //       success: true,
  //     };
  //   } catch (error) {
  //     if (error.name === 'TokenExpiredError') {
  //       throw new BadRequestException({
  //         statusCode: 400,
  //         error: 'TOKEN_EXPIRED',
  //         message: 'Password reset link has expired',
  //       });
  //     }
  //     throw new BadRequestException('Invalid or expired reset token');
  //   }
  // }
}
