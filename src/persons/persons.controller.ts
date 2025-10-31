import {
  Controller,
  Get,
  UseGuards,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Body,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PersonsService } from './persons.service';

@Controller('persons')
@UseGuards(JwtAuthGuard)
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  async getUserPersons(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.personsService.getUserPersons(
      userId,
      pageNum,
      limitNum,
      search,
    );
  }

  @Get(':id')
  async getPerson(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.personsService.getPersonById(parseInt(id), userId);
  }

  @Patch(':id')
  async updatePerson(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() updates: any,
  ) {
    return this.personsService.updatePerson(parseInt(id), userId, updates);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePerson(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.personsService.deletePerson(parseInt(id), userId);
  }
}
