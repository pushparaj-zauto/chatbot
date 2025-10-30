import { Module } from '@nestjs/common';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ AuthModule ],
  controllers: [PersonsController],
  providers: [PersonsService]
})
export class PersonsModule {}
