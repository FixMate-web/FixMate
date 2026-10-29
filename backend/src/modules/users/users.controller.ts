import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser, JwtAuthGuard } from '../../common/auth';
import { UpdateMeDto } from './dto/update-me.dto';
import { SanitizedUserProfile, UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<SanitizedUserProfile> {
    return this.usersService.getMyProfile(user.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ): Promise<SanitizedUserProfile> {
    return this.usersService.updateMyProfile(user.id, dto);
  }
}
