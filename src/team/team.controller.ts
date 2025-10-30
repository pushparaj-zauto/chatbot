import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentOrgId,
} from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto/team.dto';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // ✅ Only super_admin can create users
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('role') role: UserRole,
    @CurrentOrgId() organizationId: number,
  ) {
    if (role !== UserRole.super_admin) {
      throw new ForbiddenException('Only super admin can create users');
    }
    return this.teamService.createUser(dto, organizationId);
  }

  // ✅ Get all users in org (super_admin only)
  @Get('users')
  async getUsers(
    @CurrentUser('role') role: UserRole,
    @CurrentOrgId() organizationId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') roleFilter?: string,
    @Query('status') status?: string,
  ) {
    if (role !== UserRole.super_admin) {
      throw new ForbiddenException('Only super admin can view users');
    }
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '10');

    return this.teamService.getUsers(
      organizationId,
      pageNum,
      limitNum,
      search,
      roleFilter,
      status,
    );
  }

  // ✅ Update user (super_admin only)
  @Put('users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('role') role: UserRole,
    @CurrentOrgId() organizationId: number,
  ) {
    if (role !== UserRole.super_admin) {
      throw new ForbiddenException('Only super admin can update users');
    }
    return this.teamService.updateUser(parseInt(userId), dto, organizationId);
  }

  // ✅ Delete user (super_admin only)
  @Delete('users/:userId')
  async deleteUser(
    @Param('userId') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentOrgId() organizationId: number,
  ) {
    if (role !== UserRole.super_admin) {
      throw new ForbiddenException('Only super admin can delete users');
    }
    return this.teamService.deleteUser(parseInt(userId), organizationId);
  }
}
