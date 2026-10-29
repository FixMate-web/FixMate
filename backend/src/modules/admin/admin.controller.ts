import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../common/auth';
import { UserRole } from '../../common/domain';
import { QueryAdminUsersDto, UpdateAdminUserStatusDto } from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverviewMetrics() {
    return this.adminService.getOverviewMetrics();
  }

  @Get('users')
  listUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() dto: UpdateAdminUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(adminUser, userId, dto);
  }
}
