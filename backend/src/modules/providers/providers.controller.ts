import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
import {
  AdminProviderApprovalDto,
  ApplyProviderDto,
  QueryAdminProvidersDto,
  QueryPublicProvidersDto,
  UpdateProviderProfileDto,
  UpsertProviderServiceDto,
} from './dto/providers.dto';
import { ProvidersService } from './providers.service';

@Controller()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // =========================================================================
  // 1. Authenticated Provider Self-Service & Application Routes (BEFORE :id)
  // =========================================================================

  @UseGuards(JwtAuthGuard)
  @Post('providers/apply')
  @HttpCode(HttpStatus.OK)
  async applyAsProvider(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyProviderDto,
  ) {
    return this.providersService.applyAsProvider(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Get('providers/me')
  async getMyProviderProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.getMyProfile(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Patch('providers/me')
  async updateMyProviderProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.providersService.updateMyProfile(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post('providers/me/submit')
  @HttpCode(HttpStatus.OK)
  async submitMyProfileForReview(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.submitForReview(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Get('providers/me/services')
  async getMyServices(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.getMyServices(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Put('providers/me/services')
  async upsertMyService(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertProviderServiceDto,
  ) {
    return this.providersService.upsertMyService(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Delete('providers/me/services/:serviceId')
  async removeMyService(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceId') serviceId: string,
  ) {
    return this.providersService.removeMyService(user, serviceId);
  }

  // =========================================================================
  // 2. Admin Provider Approval & Moderation Routes
  // =========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/providers')
  async listProvidersForAdmin(@Query() query: QueryAdminProvidersDto) {
    return this.providersService.listProvidersForAdmin(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/providers/:id/approval')
  async updateProviderApproval(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminProviderApprovalDto,
  ) {
    return this.providersService.updateProviderApproval(adminUser, id, dto);
  }

  // =========================================================================
  // 3. Public Approved Provider Directory & Profile Routes (Part 09)
  // =========================================================================

  @Get('providers')
  async listPublicProviders(@Query() query: QueryPublicProvidersDto) {
    return this.providersService.listPublicProviders(query);
  }

  @Get('providers/:id')
  async getPublicProviderById(@Param('id') id: string) {
    return this.providersService.getPublicProviderById(id);
  }
}
