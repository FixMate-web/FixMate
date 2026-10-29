import { Module } from '@nestjs/common';
import { CatalogPersistenceModule } from '../../database/models/domain-persistence.modules';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [CatalogPersistenceModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
