import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
  JwtAuthGuard,
} from '../../common/auth';
import { QueryNotificationsDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.listMyNotifications(user, query);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user);
  }
}
