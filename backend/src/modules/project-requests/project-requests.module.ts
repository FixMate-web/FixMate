import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvidersPersistenceModule } from '../../database/models/domain-persistence.modules';
import { ProvidersModule } from '../providers/providers.module';
import { ProjectRequest, ProjectRequestSchema } from './project-request.schema';
import { ProjectRequestsController } from './project-requests.controller';
import { ProjectRequestsService } from './project-requests.service';
@Module({
  imports: [
    ProvidersModule,
    ProvidersPersistenceModule,
    MongooseModule.forFeature([{ name: ProjectRequest.name, schema: ProjectRequestSchema }]),
  ],
  controllers: [ProjectRequestsController],
  providers: [ProjectRequestsService],
})
export class ProjectRequestsModule {}
