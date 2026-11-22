import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';

import { LocationsController } from './controllers/locations.controller';
import { LocationsService } from './services/locations.service';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    LocationsController,
  ],

  providers: [
    LocationsService,
  ],

  exports: [
    LocationsService,
  ],
})
export class LocationsModule {}