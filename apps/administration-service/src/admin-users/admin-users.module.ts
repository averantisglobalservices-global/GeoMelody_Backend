import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';

import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    AdminUsersController,
  ],
  providers: [
    AdminUsersService,
  ],
  exports: [
    AdminUsersService,
  ],
})
export class AdminUsersModule {}