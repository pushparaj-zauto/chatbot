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
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async getUserCompanies(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.companiesService.getUserCompanies(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get(':id')
  async getCompany(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.companiesService.getCompanyById(parseInt(id), userId);
  }

  @Patch(':id')
  async updateCompany(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() updates: any,
  ) {
    return this.companiesService.updateCompany(parseInt(id), userId, updates);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCompany(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.deleteCompany(parseInt(id), userId);
  }
}
