import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';

import { MusicGenresController } from './controllers/music-genres.controller';
import { MusicGenresService } from './services/music-genres.service';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    MusicGenresController,
  ],

  providers: [
    MusicGenresService,
  ],

  exports: [
    MusicGenresService,
  ],
})
export class MusicGenresModule {}