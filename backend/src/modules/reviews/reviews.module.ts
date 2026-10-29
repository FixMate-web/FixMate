import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
