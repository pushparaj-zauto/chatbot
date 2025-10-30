import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { type Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Post('signup')
  // async signup(@Body() signupDto: SignupDto) {
  //   return await this.authService.signup(signupDto);
  // }

  // @Get('verify-email')
  // @HttpCode(HttpStatus.OK)
  // async verifyEmail(@Query('token') token: string) {
  //   return await this.authService.verifyEmail(token);
  // }

  // @Post('resend-verification')
  // @HttpCode(HttpStatus.OK)
  // async resendVerification(@Body('email') email: string) {
  //   return await this.authService.resendVerificationEmail(email);
  // }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, user } = await this.authService.login(loginDto);

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    return {
      message: 'Login successful',
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('accessToken');
    return { message: 'Logout successful' };
  }

  // @Post('reset-password')
  // @HttpCode(HttpStatus.OK)
  // async resetPassword(
  //   @Body('token') token: string,
  //   @Body('password') password: string,
  // ) {
  //   return await this.authService.resetPassword(token, password);
  // }

  // @Post('forgot-password')
  // @HttpCode(HttpStatus.OK)
  // async forgotPassword(@Body('email') email: string) {
  //   return await this.authService.forgotPassword(email);
  // }
}
