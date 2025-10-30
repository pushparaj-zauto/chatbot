import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserEvents(
    userId: number,
    organizationId: number,
    status?: string,
    priority?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = { userId, organizationId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.eventDate = {};
      if (startDate) {
        where.eventDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.eventDate.lte = new Date(endDate);
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.event.count({ where });

    const events = await this.prisma.event.findMany({
      where,
      orderBy: [{ eventDate: 'asc' }, { eventTime: 'asc' }],
      skip,
      take: limit,
    });

    return {
      events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async getEventById(eventId: number, userId: number, organizationId: number) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
        organizationId
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return { event };
  }

  async updateEvent(eventId: number, userId: number, organizationId: number, updates: any) {
    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId, organizationId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: updates,
    });

    return { success: true, event: updatedEvent };
  }

  async deleteEvent(eventId: number, userId: number, organizationId: number) {
    // Verify ownership
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId, organizationId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true, message: 'Event deleted successfully' };
  }
}
