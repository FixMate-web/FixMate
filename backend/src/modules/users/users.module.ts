import { Module } from '@nestjs/common';
import { UsersPersistenceModule } from '../../database/models/domain-persistence.modules';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UsersPersistenceModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
