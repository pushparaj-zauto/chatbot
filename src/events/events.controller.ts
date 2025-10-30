import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentOrgId } from 'src/auth/decorators/current-user.decorator';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getUserEvents(
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventsService.getUserEvents(
      userId,
      organizationId,
      status,
      priority,
      startDate,
      endDate,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  async getEvent(@Param('id') id: string, @CurrentUser('id') userId: number, @CurrentOrgId() organizationId: number,) {
    return this.eventsService.getEventById(parseInt(id), userId, organizationId);
  }

  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
    @Body() updates: any,
  ) {
    return this.eventsService.updateEvent(parseInt(id), userId, organizationId, updates);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @CurrentOrgId() organizationId: number,
  ) {
    return this.eventsService.deleteEvent(parseInt(id), userId, organizationId);
  }
}
