import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCompanies(userId: number) {
    const companies = await this.prisma.company.findMany({
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

    return { companies };
  }

  async getCompanyById(companyId: number, userId: number) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
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

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return { company };
  }

  async updateCompany(companyId: number, userId: number, updates: any) {
    // Verify ownership
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: updates,
    });

    return { success: true, company: updatedCompany };
  }

  async deleteCompany(companyId: number, userId: number) {
    // Verify ownership
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.company.delete({
      where: { id: companyId },
    });

    return { success: true, message: 'Company deleted successfully' };
  }
}
