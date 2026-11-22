import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
} from '@geomelody/auth';

import {
  InstrumentsService,
} from '../services/instruments.service';

import {
  CreateInstrumentDto,
} from '../dto/create-instrument.dto';

import {
  UpdateInstrumentDto,
} from '../dto/update-instrument.dto';

import {
  UpdateInstrumentStatusDto,
} from '../dto/update-instrument-status.dto';

@Controller('api/v1/admin/instruments')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class InstrumentsController {
  constructor(
    private readonly instrumentsService: InstrumentsService,
  ) {}

  // ==========================================================
  // LIST
  // ==========================================================

  @Get()
  @Permissions('INSTRUMENT_VIEW')
  async findAll() {
    return this.instrumentsService.findAll();
  }

  // ==========================================================
  // DETAILS
  // ==========================================================

  @Get(':id')
  @Permissions('INSTRUMENT_VIEW')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.instrumentsService.findOne(
      id,
    );
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  @Post()
  @Permissions('INSTRUMENT_CREATE')
  @UseInterceptors(
    FileInterceptor('image'),
  )
  async create(
    @Body() dto: CreateInstrumentDto,
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.instrumentsService.create(
      dto,
      file,
    );
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  @Patch(':id')
  @Permissions('INSTRUMENT_UPDATE')
  @UseInterceptors(
    FileInterceptor('image'),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstrumentDto,
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    return this.instrumentsService.update(
      id,
      dto,
      file,
    );
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  @Patch(':id/status')
  @Permissions(
    'INSTRUMENT_STATUS_UPDATE',
  )
  async updateStatus(
    @Param('id') id: string,
    @Body()
    dto: UpdateInstrumentStatusDto,
  ) {
    return this.instrumentsService.updateStatus(
      id,
      dto.status,
    );
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  @Delete(':id')
  @Permissions('INSTRUMENT_DELETE')
  async remove(
    @Param('id') id: string,
  ) {
    return this.instrumentsService.remove(
      id,
    );
  }
}