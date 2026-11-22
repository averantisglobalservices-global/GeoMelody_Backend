import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';

import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    RolesController,
  ],
  providers: [
    RolesService,
  ],
  exports: [
    RolesService,
  ],
})
export class RolesModule {}