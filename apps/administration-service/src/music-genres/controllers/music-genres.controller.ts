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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { StorageService } from '@geomelody/storage';
import {
  JwtAuthGuard,
  Permissions,
  PermissionsGuard,
} from '@geomelody/auth';

// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { PermissionsGuard } from '../../auth/guards/permissions.guard';
// import { Permissions } from '../../auth/decorators/permissions.decorator';

import { CreateMusicGenreDto } from '../dto/create-music-genre.dto';
import { UpdateMusicGenreDto } from '../dto/update-music-genre.dto';
import { UpdateMusicGenreStatusDto } from '../dto/update-music-genre-status.dto';
import { MusicGenresService } from '../services/music-genres.service';
@Controller('api/v1/admin/music-genres')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MusicGenresController {
  constructor(
    private readonly musicGenresService: MusicGenresService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @Permissions('MUSIC_GENRE_VIEW')
  async findAll() {
    const musicGenres = await this.musicGenresService.findAll();

    return musicGenres.map((musicGenre) => ({
      ...musicGenre,
      image: musicGenre.image
        ? this.storageService.getUrl(musicGenre.image)
        : null,
    }));
  }

  @Get(':id')
  @Permissions('MUSIC_GENRE_VIEW')
  async findOne(@Param('id') id: string) {
    const musicGenre = await this.musicGenresService.findOne(id);

    return {
      ...musicGenre,
      image: musicGenre.image
        ? this.storageService.getUrl(musicGenre.image)
        : null,
    };
  }

  @Post()
  @Permissions('MUSIC_GENRE_CREATE')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async create(
    @Body() dto: CreateMusicGenreDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageKey: string | undefined;

    if (file) {
      imageKey = await this.storageService.upload(file, 'music-genres');
    }

    try {
      const musicGenre = await this.musicGenresService.create(dto, imageKey);

      return {
        ...musicGenre,
        image: musicGenre.image
          ? this.storageService.getUrl(musicGenre.image)
          : null,
      };
    } catch (error) {
      // If database creation fails after the file was uploaded,
      // remove the newly uploaded file.
      if (imageKey) {
        await this.storageService.delete(imageKey);
      }

      throw error;
    }
  }

  @Patch(':id')
  @Permissions('MUSIC_GENRE_UPDATE')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMusicGenreDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageKey: string | undefined;

    if (file) {
      imageKey = await this.storageService.upload(file, 'music-genres');
    }

    try {
      const musicGenre = await this.musicGenresService.update(
        id,
        dto,
        imageKey,
      );

      return {
        ...musicGenre,
        image: musicGenre.image
          ? this.storageService.getUrl(musicGenre.image)
          : null,
      };
    } catch (error) {
      // If database update fails after uploading the new image,
      // remove the new file.
      if (imageKey) {
        await this.storageService.delete(imageKey);
      }

      throw error;
    }
  }

  @Patch(':id/status')
  @Permissions('MUSIC_GENRE_STATUS_UPDATE')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMusicGenreStatusDto,
  ) {
    return this.musicGenresService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Permissions('MUSIC_GENRE_DELETE')
  async remove(@Param('id') id: string) {
    return this.musicGenresService.remove(id);
  }
}