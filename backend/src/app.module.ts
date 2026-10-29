import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnvironment } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectRequestsModule } from './modules/project-requests/project-requests.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 30,
      },
    ]),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    ProvidersModule,
    ProjectRequestsModule,
    NotificationsModule,
    BookingsModule,
    ReviewsModule,
    AdminModule,
  ],
})
export class AppModule {}
