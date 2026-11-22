import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import type { SignOptions } from 'jsonwebtoken';
import { join } from 'path';

import { DatabaseModule } from '@geomelody/database';
import { GeoMelodyConfigModule } from '@geomelody/config';
import { StorageModule } from '@geomelody/storage';

import { RolesModule } from './roles/roles.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { MusicGenresModule } from './music-genres/music-genres.module';
import { ArtistRolesModule } from './artist-roles/artist-roles.module';
import { InstrumentsModule } from './instruments/instruments.module';

@Module({
  imports: [
    GeoMelodyConfigModule,

    DatabaseModule,

    /**
     * Shared storage configuration
     *
     * Administration Service owns:
     * apps/administration-service/uploads/
     *
     * Public URL:
     * http://localhost:3002/uploads/*
     */
    StorageModule.forRoot({
      uploadRoot: join(
        process.cwd(),
        'apps',
        'administration-service',
        'uploads',
      ),
      publicUrl:
        process.env.ADMIN_SERVICE_PUBLIC_URL ??
        'http://localhost:3002',
    }),

    /**
     * Serve uploaded files
     *
     * Physical directory:
     * apps/administration-service/uploads/
     *
     * Public URL:
     * /uploads/*
     */
    ServeStaticModule.forRoot({
      rootPath: join(
        process.cwd(),
        'apps',
        'administration-service',
        'uploads',
      ),
      serveRoot: '/uploads',
    }),

    JwtModule.registerAsync({
      imports: [GeoMelodyConfigModule],
      inject: [ConfigService],
      global: true,

      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>(
            'JWT_ACCESS_SECRET',
          );

        if (!secret) {
          throw new Error(
            'JWT_ACCESS_SECRET is not configured',
          );
        }

        const expiresIn =
          configService.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
          ) ?? '15m';

        return {
          secret,
          signOptions: {
            expiresIn:
              expiresIn as SignOptions['expiresIn'],
          },
        };
      },
    }),

    RolesModule,
    AdminUsersModule,
    MusicGenresModule,
    ArtistRolesModule,
    InstrumentsModule,
  ],
})
export class AdministrationServiceModule {}