import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';

import { InstrumentsController } from './controllers/instruments.controller';
import { InstrumentsService } from './services/instruments.service';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    InstrumentsController,
  ],

  providers: [
    InstrumentsService,
  ],

  exports: [
    InstrumentsService,
  ],
})
export class InstrumentsModule {}