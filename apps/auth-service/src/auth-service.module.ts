import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

import { DatabaseModule } from '@geomelody/database';
import { GeoMelodyConfigModule } from '@geomelody/config';

import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';

import { AdminAuthController } from './auth/controllers/admin-auth.controller';
import { AdminAuthService } from './auth/services/admin-auth.service';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ArtistAuthModule } from './auth/artist/artist-auth.module';
import { LocationsModule } from './locations/locations.module';
//import { PermissionsGuard } from './auth/guards/permissions.guard';

@Module({
  imports: [
    GeoMelodyConfigModule,

    DatabaseModule,

    JwtModule.registerAsync({
      imports: [GeoMelodyConfigModule],
      inject: [ConfigService],
      global: true,

      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>(
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
     ArtistAuthModule,
     LocationsModule,
  ],

  controllers: [
    AuthServiceController,
    AdminAuthController,
  ],

  providers: [
    AuthServiceService,
    AdminAuthService,
    JwtAuthGuard,
    RolesGuard,
    //PermissionsGuard,
    
  ],
})
export class AuthServiceModule {}