import { Module } from '@nestjs/common';
import { CanopusService } from './canopus.service';
import { CanopusController } from './canopus.controller';

@Module({
  providers: [CanopusService],
  controllers: [CanopusController],
  exports: [ CanopusService ]
})
export class CanopusModule {}
