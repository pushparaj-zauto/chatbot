import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConfigurablesService } from './configurables.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('configurables')
@UseGuards(JwtAuthGuard)
export class ConfigurablesController {
  constructor(private readonly configurablesService: ConfigurablesService) {}

  @Get()
  async getAll(@CurrentUser('organizationId') organizationId: number) {
    return this.configurablesService.getConfigurableFields(organizationId);
  }

  @Post('initialize')
  async initialize(@CurrentUser('organizationId') organizationId: number) {
    return this.configurablesService.initializeDefaultFields(organizationId);
  }

  @Get(':entityType/:fieldName')
  async getOptions(
    @CurrentUser('organizationId') organizationId: number,
    @Param('entityType') entityType: string,
    @Param('fieldName') fieldName: string,
  ) {
    return this.configurablesService.getConfigurableOptions(
      organizationId,
      entityType,
      fieldName,
    );
  }

  @Post(':entityType/:fieldName/options')
  async addOption(
    @CurrentUser('organizationId') organizationId: number,
    @Param('entityType') entityType: string,
    @Param('fieldName') fieldName: string,
    @Body() body: { value: string; label: string },
  ) {
    return this.configurablesService.addOption(
      organizationId,
      entityType,
      fieldName,
      body.value,
      body.label,
    );
  }

  @Patch('options/:optionId')
  async updateOption(
    @Param('optionId') optionId: string,
    @Body() body: { label: string; isActive: boolean },
  ) {
    return this.configurablesService.updateOption(
      parseInt(optionId),
      body.label,
      body.isActive,
    );
  }

  @Delete('options/:optionId')
  async deleteOption(@Param('optionId') optionId: string) {
    return this.configurablesService.deleteOption(parseInt(optionId));
  }
}
