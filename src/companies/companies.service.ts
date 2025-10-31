import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCompanies(
    userId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const where: any = { userId };

    // Add search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      where.OR = [
        { name: { contains: searchLower, mode: 'insensitive' } },
        { industry: { contains: searchLower, mode: 'insensitive' } },
        { location: { contains: searchLower, mode: 'insensitive' } },
        { status: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          events: {
            include: {
              event: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
