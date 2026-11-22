import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';
import { StorageService } from '@geomelody/storage';

import { CreateArtistRoleDto } from '../dto/create-artist-role.dto';
import { UpdateArtistRoleDto } from '../dto/update-artist-role.dto';

@Injectable()
export class ArtistRolesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * List all non-deleted artist roles.
   */
  async findAll() {
    return this.databaseService.artistRole.findMany({
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

  /**
   * Get one artist role.
   */
  async findOne(id: string) {
    const artistRole =
      await this.databaseService.artistRole.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!artistRole) {
      throw new NotFoundException(
        'Artist role not found',
      );
    }

    return artistRole;
  }

  /**
   * Create artist role.
   */
  async create(
    dto: CreateArtistRoleDto,
    image?: string,
  ) {
    const code = this.normalizeCode(dto.code);

    const existingArtistRole =
      await this.databaseService.artistRole.findUnique({
        where: {
          code,
        },
      });

    if (existingArtistRole) {
      throw new ConflictException(
        'Artist role code already exists',
      );
    }

    return this.databaseService.artistRole.create({
      data: {
        name: dto.name.trim(),
        code,
        image: image ?? null,
        status: 1,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  /**
   * Update artist role.
   *
   * When a new image is provided:
   * - new image key is saved to DB
   * - old image is deleted after DB update succeeds
   */
  async update(
    id: string,
    dto: UpdateArtistRoleDto,
    image?: string,
  ) {
    const artistRole =
      await this.databaseService.artistRole.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!artistRole) {
      throw new NotFoundException(
        'Artist role not found',
      );
    }

    let code: string | undefined;

    if (dto.code !== undefined) {
      code = this.normalizeCode(dto.code);

      if (code !== artistRole.code) {
        const existingArtistRole =
          await this.databaseService.artistRole.findUnique({
            where: {
              code,
            },
          });

        if (existingArtistRole) {
          throw new ConflictException(
            'Artist role code already exists',
          );
        }
      }
    }

    const updatedArtistRole =
      await this.databaseService.artistRole.update({
        where: {
          id: artistRole.id,
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

    /**
     * Remove old image after successful DB update.
     */
    if (
      image !== undefined &&
      artistRole.image &&
      artistRole.image !== image
    ) {
      try {
        await this.storageService.delete(
          artistRole.image,
        );
      } catch (error) {
        console.error(
          'Failed to delete old artist role image:',
          error,
        );
      }
    }

    return updatedArtistRole;
  }

  /**
   * Update status.
   *
   * 1 = active
   * 0 = inactive
   */
  async updateStatus(
    id: string,
    status: number,
  ) {
    const artistRole =
      await this.databaseService.artistRole.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!artistRole) {
      throw new NotFoundException(
        'Artist role not found',
      );
    }

    return this.databaseService.artistRole.update({
      where: {
        id: artistRole.id,
      },
      data: {
        status,
      },
    });
  }

  /**
   * Soft delete.
   */
  async remove(id: string) {
    const artistRole =
      await this.databaseService.artistRole.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!artistRole) {
      throw new NotFoundException(
        'Artist role not found',
      );
    }

    return this.databaseService.artistRole.update({
      where: {
        id: artistRole.id,
      },
      data: {
        deletedAt: new Date(),
        status: 0,
      },
    });
  }

  /**
   * Normalize code.
   *
   * Example:
   * "Electronic Music Artist"
   * →
   * "ELECTRONIC_MUSIC_ARTIST"
   */
  private normalizeCode(code: string): string {
    return code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }
}