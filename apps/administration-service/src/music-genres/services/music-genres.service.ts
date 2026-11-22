import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';
import { StorageService } from '@geomelody/storage';

import { CreateMusicGenreDto } from '../dto/create-music-genre.dto';
import { UpdateMusicGenreDto } from '../dto/update-music-genre.dto';

@Injectable()
export class MusicGenresService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  async findAll() {
    return this.databaseService.musicGenre.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const musicGenre = await this.databaseService.musicGenre.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!musicGenre) {
      throw new NotFoundException('Music genre not found');
    }

    return musicGenre;
  }

  async create(
    dto: CreateMusicGenreDto,
    image?: string,
  ) {
    const code = this.normalizeCode(dto.code);

    const existingGenre =
      await this.databaseService.musicGenre.findUnique({
        where: {
          code,
        },
      });

    if (existingGenre) {
      throw new ConflictException(
        'Music genre code already exists',
      );
    }

    return this.databaseService.musicGenre.create({
      data: {
        name: dto.name.trim(),
        code,
        image: image ?? null,
        status: 1,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateMusicGenreDto,
    image?: string,
  ) {
    const musicGenre =
      await this.databaseService.musicGenre.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!musicGenre) {
      throw new NotFoundException('Music genre not found');
    }

    let code: string | undefined;

    if (dto.code !== undefined) {
      code = this.normalizeCode(dto.code);

      if (code !== musicGenre.code) {
        const existingGenre =
          await this.databaseService.musicGenre.findUnique({
            where: {
              code,
            },
          });

        if (existingGenre) {
          throw new ConflictException(
            'Music genre code already exists',
          );
        }
      }
    }

    const updatedMusicGenre =
      await this.databaseService.musicGenre.update({
        where: {
          id: musicGenre.id,
        },
        data: {
          ...(dto.name !== undefined && {
            name: dto.name.trim(),
          }),

          ...(code !== undefined && {
            code,
          }),

          ...(dto.sortOrder !== undefined && {
            sortOrder: dto.sortOrder,
          }),

          ...(image !== undefined && {
            image,
          }),
        },
      });

    /*
     * If a new image was uploaded successfully and the database
     * was updated successfully, remove the previous image.
     */
    if (
      image !== undefined &&
      musicGenre.image &&
      musicGenre.image !== image
    ) {
      try {
        await this.storageService.delete(
          musicGenre.image,
        );
      } catch (error) {
        /*
         * Do not fail the API request because old-file cleanup
         * failed after the database update succeeded.
         *
         * In production, this can be replaced with a background
         * cleanup job / queue.
         */
        console.error(
          'Failed to delete old music genre image:',
          error,
        );
      }
    }

    return updatedMusicGenre;
  }

  async updateStatus(
    id: string,
    status: number,
  ) {
    const musicGenre =
      await this.databaseService.musicGenre.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!musicGenre) {
      throw new NotFoundException(
        'Music genre not found',
      );
    }

    return this.databaseService.musicGenre.update({
      where: {
        id: musicGenre.id,
      },
      data: {
        status,
      },
    });
  }

  async remove(id: string) {
    const musicGenre =
      await this.databaseService.musicGenre.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!musicGenre) {
      throw new NotFoundException(
        'Music genre not found',
      );
    }

    /*
     * Soft delete the database record.
     *
     * We intentionally do not immediately delete the image
     * here. Keeping the file allows recovery/audit and gives us
     * the option to implement permanent cleanup later.
     */
    return this.databaseService.musicGenre.update({
      where: {
        id: musicGenre.id,
      },
      data: {
        deletedAt: new Date(),
        status: 0,
      },
    });
  }

  private normalizeCode(code: string): string {
    return code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }
}