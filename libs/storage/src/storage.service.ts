import { Injectable } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';

@Injectable()
export class StorageService {
  constructor(
    private readonly localStorageService: LocalStorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    return this.localStorageService.upload(
      file,
      folder,
    );
  }

  async delete(
    storageKey: string,
  ): Promise<void> {
    return this.localStorageService.delete(
      storageKey,
    );
  }

  getUrl(
    storageKey: string,
  ): string {
    return this.localStorageService.getUrl(
      storageKey,
    );
  }
}