import { Module } from '@nestjs/common';

import { DatabaseModule } from '@geomelody/database';
import { GeoMelodyConfigModule } from '@geomelody/config';

import { ArtistRegistrationController } from './controllers/artist-registration.controller';
import { ArtistLoginController } from './controllers/artist-login.controller';

import { ArtistRegistrationService } from './services/artist-registration.service';
import { ArtistLoginService } from './services/artist-login.service';
import { RegistrationOtpService } from './services/registration-otp.service';

import { AuthTokenService } from '../services/auth-token.service';

@Module({
  imports: [
    DatabaseModule,
    GeoMelodyConfigModule,
  ],

  controllers: [
    ArtistRegistrationController,
    ArtistLoginController,
  ],

  providers: [
    ArtistRegistrationService,
    ArtistLoginService,
    RegistrationOtpService,
    AuthTokenService,
  ],

  exports: [
    ArtistRegistrationService,
    ArtistLoginService,
    AuthTokenService,
  ],
})
export class ArtistAuthModule {}