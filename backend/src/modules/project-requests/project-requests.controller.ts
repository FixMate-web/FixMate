import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../../common/auth';
import { UserRole } from '../../common/domain';
import {
  CreateProjectRequestDto,
  QueryProjectRequestsDto,
  RespondToProjectRequestDto,
} from './project-requests.dto';
import { ProjectRequestsService } from './project-requests.service';
@Controller('project-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectRequestsController {
  constructor(private readonly service: ProjectRequestsService) {}
  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectRequestDto) {
    return this.service.create(user, dto);
  }
  @Get() list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryProjectRequestsDto) {
    return this.service.list(user, query);
  }
  @Get(':id') detail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }
  @Patch(':id/response')
  @Roles(UserRole.PROVIDER)
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RespondToProjectRequestDto,
  ) {
    return this.service.respond(user, id, dto);
  }
  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cancel(user, id);
  }
}
