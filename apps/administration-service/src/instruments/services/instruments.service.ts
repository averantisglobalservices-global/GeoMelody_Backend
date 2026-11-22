import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DatabaseService,
} from '@geomelody/database';

import {
  StorageService,
} from '@geomelody/storage';

import {
  CreateInstrumentDto,
} from '../dto/create-instrument.dto';

import {
  UpdateInstrumentDto,
} from '../dto/update-instrument.dto';

@Injectable()
export class InstrumentsService {
  private readonly storageFolder = 'music-instruments';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  // ==========================================================
  // LIST
  // ==========================================================

  async findAll() {
    const instruments =
      await this.databaseService.instrument.findMany({
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

    return instruments.map((instrument) => ({
      ...instrument,
      image: instrument.image
        ? this.storageService.getUrl(
            instrument.image,
          )
        : null,
    }));
  }

  // ==========================================================
  // DETAILS
  // ==========================================================

  async findOne(id: string) {
    const instrument =
      await this.databaseService.instrument.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!instrument) {
      throw new NotFoundException(
        'Instrument not found',
      );
    }

    return {
      ...instrument,
      image: instrument.image
        ? this.storageService.getUrl(
            instrument.image,
          )
        : null,
    };
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  async create(
    dto: CreateInstrumentDto,
    file?: Express.Multer.File,
  ) {
    const code = this.normalizeCode(
      dto.code,
    );

    const existingInstrument =
      await this.databaseService.instrument.findUnique({
        where: {
          code,
        },
      });

    if (existingInstrument) {
      throw new ConflictException(
        'Instrument code already exists',
      );
    }

    let imageKey: string | undefined;

    // Upload image first.
    if (file) {
      imageKey =
        await this.storageService.upload(
          file,
          this.storageFolder,
        );
    }

    try {
      const instrument =
        await this.databaseService.instrument.create({
          data: {
            code,
            name: dto.name.trim(),
            image: imageKey ?? null,
            status: 1,
            sortOrder:
              dto.sortOrder ?? 0,
          },
        });

      return {
        ...instrument,
        image: instrument.image
          ? this.storageService.getUrl(
              instrument.image,
            )
          : null,
      };
    } catch (error) {
      // If DB creation fails, remove newly uploaded file.
      if (imageKey) {
        await this.storageService.delete(
          imageKey,
        );
      }

      throw error;
    }
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    id: string,
    dto: UpdateInstrumentDto,
    file?: Express.Multer.File,
  ) {
    const instrument =
      await this.databaseService.instrument.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!instrument) {
      throw new NotFoundException(
        'Instrument not found',
      );
    }

    let code: string | undefined;

    if (dto.code !== undefined) {
      code = this.normalizeCode(dto.code);

      const existingInstrument =
        await this.databaseService.instrument.findFirst({
          where: {
            code,
            id: {
              not: id,
            },
            deletedAt: null,
          },
        });

      if (existingInstrument) {
        throw new ConflictException(
          'Instrument code already exists',
        );
      }
    }

    let newImageKey: string | undefined;

    // Upload replacement image.
    if (file) {
      newImageKey =
        await this.storageService.upload(
          file,
          this.storageFolder,
        );
    }

    try {
      const updatedInstrument =
        await this.databaseService.instrument.update({
          where: {
            id: instrument.id,
          },
          data: {
            ...(code !== undefined && {
              code,
            }),

            ...(dto.name !== undefined && {
              name: dto.name.trim(),
            }),

            ...(dto.sortOrder !== undefined && {
              sortOrder: dto.sortOrder,
            }),

            ...(newImageKey !== undefined && {
              image: newImageKey,
            }),
          },
        });

      // Delete old image only after DB update succeeds.
      if (
        newImageKey &&
        instrument.image
      ) {
        await this.storageService.delete(
          instrument.image,
        );
      }

      return {
        ...updatedInstrument,
        image: updatedInstrument.image
          ? this.storageService.getUrl(
              updatedInstrument.image,
            )
          : null,
      };
    } catch (error) {
      // DB update failed, so remove newly uploaded image.
      if (newImageKey) {
        await this.storageService.delete(
          newImageKey,
        );
      }

      throw error;
    }
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async updateStatus(
    id: string,
    status: number,
  ) {
    const instrument =
      await this.databaseService.instrument.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!instrument) {
      throw new NotFoundException(
        'Instrument not found',
      );
    }

    const updatedInstrument =
      await this.databaseService.instrument.update({
        where: {
          id: instrument.id,
        },
        data: {
          status,
        },
      });

    return {
      ...updatedInstrument,
      image: updatedInstrument.image
        ? this.storageService.getUrl(
            updatedInstrument.image,
          )
        : null,
    };
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async remove(id: string) {
    const instrument =
      await this.databaseService.instrument.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!instrument) {
      throw new NotFoundException(
        'Instrument not found',
      );
    }

    const deletedInstrument =
      await this.databaseService.instrument.update({
        where: {
          id: instrument.id,
        },
        data: {
          deletedAt: new Date(),
          status: 0,
        },
      });

    // Remove physical image after soft delete.
    if (instrument.image) {
      await this.storageService.delete(
        instrument.image,
      );
    }

    return {
      ...deletedInstrument,
      image: null,
    };
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  private normalizeCode(
    code: string,
  ): string {
    return code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }
}