import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPersons(
    userId: number,
    page: number = 1,
    limit: number = 12,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [persons, total] = await Promise.all([
      this.prisma.person.findMany({
        where: whereClause,
        include: {
          events: {
            include: {
              event: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.person.count({
        where: whereClause,
      }),
    ]);

    return {
      persons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPersonById(personId: number, userId: number) {
    const person = await this.prisma.person.findFirst({
      where: {
        id: personId,
        userId,
      },
      include: {
        events: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return { person };
  }

  async updatePerson(personId: number, userId: number, updates: any) {
    // Verify ownership
    const person = await this.prisma.person.findFirst({
      where: { id: personId, userId },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const updatedPerson = await this.prisma.person.update({
      where: { id: personId },
      data: updates,
    });

    return { success: true, person: updatedPerson };
  }

  async deletePerson(personId: number, userId: number) {
    // Verify ownership
    const person = await this.prisma.person.findFirst({
      where: { id: personId, userId },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    await this.prisma.person.delete({
      where: { id: personId },
    });

    return { success: true, message: 'Person deleted successfully' };
  }
}
