import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';
import { StorageModule } from '@geomelody/storage';

import { ArtistRolesController } from './controllers/artist-roles.controller';
import { ArtistRolesService } from './services/artist-roles.service';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
  ],
  controllers: [
    ArtistRolesController,
  ],
  providers: [
    ArtistRolesService,
  ],
  exports: [
    ArtistRolesService,
  ],
})
export class ArtistRolesModule {}