import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

import { STORAGE_OPTIONS } from './storage.constants';
import type { StorageModuleOptions } from './storage.constants';

@Injectable()
export class LocalStorageService {
  constructor(
    @Inject(STORAGE_OPTIONS)
    private readonly options: StorageModuleOptions,
  ) {}

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const extension = extname(file.originalname).toLowerCase();

    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
    ];

    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        'Only JPG, JPEG, PNG and WEBP files are allowed',
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException(
        'File size must not exceed 2 MB',
      );
    }

    const folderPath = join(
      this.options.uploadRoot,
      folder,
    );

    await fs.mkdir(folderPath, {
      recursive: true,
    });

    const fileName = `${randomUUID()}${extension}`;

    const filePath = join(
      folderPath,
      fileName,
    );

    await fs.writeFile(
      filePath,
      file.buffer,
    );

    return `${folder}/${fileName}`;
  }

  async delete(
    storageKey: string,
  ): Promise<void> {
    if (!storageKey) {
      return;
    }

    const normalizedKey =
      this.normalizeStorageKey(storageKey);

    const filePath = join(
      this.options.uploadRoot,
      normalizedKey,
    );

    try {
      await fs.unlink(filePath);
    } catch (error) {
      const err =
        error as NodeJS.ErrnoException;

      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getUrl(
    storageKey: string,
  ): string {
    if (!storageKey) {
      return '';
    }

    const normalizedKey =
      this.normalizeStorageKey(storageKey);

    return `${this.options.publicUrl}/uploads/${normalizedKey}`;
  }

  private normalizeStorageKey(
    storageKey: string,
  ): string {
    return storageKey
      .replace(/^\/+/, '')
      .replace(/^uploads\/+/, '');
  }
}