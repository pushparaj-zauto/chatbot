import { Module } from '@nestjs/common';
import { ConfigurablesController } from './configurables.controller';
import { ConfigurablesService } from './configurables.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ConfigurablesController],
  providers: [ConfigurablesService, PrismaService],
  exports: [ConfigurablesService],
})
export class ConfigurablesModule {}
