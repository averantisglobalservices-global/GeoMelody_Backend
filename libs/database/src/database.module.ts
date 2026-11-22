import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { GeoMelodyConfigModule } from '@geomelody/config';

@Module({
  imports: [GeoMelodyConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}