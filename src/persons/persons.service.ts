import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPersons(userId: number) {
    const persons = await this.prisma.person.findMany({
      where: { userId },
      include: {
        events: {
          include: {
            event: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { persons };
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
