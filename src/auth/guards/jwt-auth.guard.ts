import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AppConfigService } from 'src/config/app-config.service'; 
import { PrismaService } from 'src/prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private appConfig: AppConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException('No token found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.appConfig.jwtSecret,
      });

      // Find user in the DB
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
        include: { organization: true },
      });

      // check user exists and is active
      if(!user || user.status !== UserStatus.active) {
        throw new UnauthorizedException('Unauthorized!')
      }

      // Attach user data to request object
      request['user'] = user;
      request['organizationId'] = user.organizationId;

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    // Extract token from HttpOnly cookie
    return request.cookies?.accessToken;
  }
}
