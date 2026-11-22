import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { GeoMelodyConfigModule } from '@geomelody/config';
import { StorageModule } from '@geomelody/storage';

import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    GeoMelodyConfigModule,

    /**
     * Shared storage configuration
     *
     * Artist Service owns:
     * apps/artist-service/uploads/
     *
     * Public URL:
     * http://localhost:3003/uploads/*
     */
    StorageModule.forRoot({
      uploadRoot: join(
        process.cwd(),
        'apps',
        'artist-service',
        'uploads',
      ),
      publicUrl:
        process.env.ARTIST_SERVICE_PUBLIC_URL ??
        'http://localhost:3003',
    }),

    /**
     * Serve artist uploaded files
     *
     * Physical directory:
     * apps/artist-service/uploads/
     *
     * Public URL:
     * /uploads/*
     */
    ServeStaticModule.forRoot({
      rootPath: join(
        process.cwd(),
        'apps',
        'artist-service',
        'uploads',
      ),
      serveRoot: '/uploads',
    }),

    JwtModule.registerAsync({
      imports: [
        GeoMelodyConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      global: true,

      useFactory: (
        configService: ConfigService,
      ) => {
        const secret =
          configService.get<string>(
            'JWT_ACCESS_SECRET',
          );

        if (!secret) {
          throw new Error(
            'JWT_ACCESS_SECRET is not configured.',
          );
        }

        return {
          secret,
        };
      },
    }),

    ProfileModule,
  ],
})
export class ArtistServiceModule {}