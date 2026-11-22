import { DynamicModule, Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import {
  STORAGE_OPTIONS,
  StorageModuleOptions,
} from './storage.constants';

@Global()
@Module({})
export class StorageModule {
  static forRoot(options: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: STORAGE_OPTIONS,
          useValue: options,
        },
        LocalStorageService,
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}