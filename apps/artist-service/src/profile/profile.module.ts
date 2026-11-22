import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';

import { ArtistProfileController } from './controllers/artist-profile/artist-profile.controller';

import { ArtistProfileService } from './services/artist-profile.service';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    ArtistProfileController,
  ],

  providers: [
    ArtistProfileService,
  ],

  exports: [
    ArtistProfileService,
  ],
})
export class ProfileModule {}