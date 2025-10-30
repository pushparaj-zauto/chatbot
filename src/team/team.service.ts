import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './dto/team.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async createUser(dto: CreateUserDto, organizationId: number) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await this.authService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        mobile: dto.mobile,
        whatsapp: dto.whatsapp,
        role: dto.role || 'user',
        organizationId,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        whatsapp: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      message: 'User created successfully',
      user,
    };
  }

  async getUsers(
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { whatsapp: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          mobile: true,
          whatsapp: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(userId: number, dto: UpdateUserDto, organizationId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        mobile: dto.mobile,
        whatsapp: dto.whatsapp,
        role: dto.role,
        status: dto.status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        whatsapp: true,
        role: true,
        status: true,
      },
    });

    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }

  async deleteUser(userId: number, organizationId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'User deleted successfully',
    };
  }
}
