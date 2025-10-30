import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ AuthModule ],
  providers: [TeamService],
  controllers: [TeamController],
})
export class TeamModule {}
