import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AddressesController } from './addresses.controller';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AddressesController, BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
