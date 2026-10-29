import { Module } from '@nestjs/common';
import {
  CatalogPersistenceModule,
  ProvidersPersistenceModule,
  UsersPersistenceModule,
} from '../../database/models/domain-persistence.modules';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [
    ProvidersPersistenceModule,
    CatalogPersistenceModule,
    UsersPersistenceModule,
    NotificationsModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
