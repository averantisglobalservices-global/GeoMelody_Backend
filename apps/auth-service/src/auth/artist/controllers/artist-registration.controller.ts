import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { StartRegistrationDto } from '../dto/start-registration.dto';
import { VerifyArtistEmailDto } from '../dto/verify-email-otp.dto';
import { VerifyArtistMobileDto } from '../dto/verify-mobile-otp.dto';
import { CompleteArtistRegistrationDto } from '../dto/complete-registration.dto';

import { ArtistRegistrationService } from '../services/artist-registration.service';

@Controller('api/v1/artist/artist-registration')
export class ArtistRegistrationController {
  constructor(
    private readonly artistRegistrationService: ArtistRegistrationService,
  ) {}

  // ==========================================================
  // 1. START / CONTINUE REGISTRATION
  // ==========================================================
  //
  // POST
  // /api/v1/artist/artist-registration/start
  //
  // First request:
  //
  // Email flow:
  // {
  //   "email": "artist@example.com"
  // }
  //
  // Mobile flow:
  // {
  //   "countryCode": "+91",
  //   "mobile": "9876543210"
  // }
  //
  // Continue registration:
  //
  // {
  //   "registrationId": "...",
  //   "email": "artist@example.com"
  // }
  //
  // OR
  //
  // {
  //   "registrationId": "...",
  //   "countryCode": "+91",
  //   "mobile": "9876543210"
  // }
  //
  // OTP expiry = 2 minutes
  // ==========================================================

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startRegistration(
    @Body() dto: StartRegistrationDto,
  ) {
    return this.artistRegistrationService.startRegistration(dto);
  }

  // ==========================================================
  // 2. VERIFY EMAIL OTP
  // ==========================================================

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyArtistEmailDto,
  ) {
    return this.artistRegistrationService.verifyEmailOtp(dto);
  }

  // ==========================================================
  // 3. VERIFY MOBILE OTP
  // ==========================================================

  @Post('verify-mobile')
  @HttpCode(HttpStatus.OK)
  async verifyMobile(
    @Body() dto: VerifyArtistMobileDto,
  ) {
    return this.artistRegistrationService.verifyMobileOtp(dto);
  }

  // ==========================================================
  // 4. COMPLETE REGISTRATION
  // ==========================================================
  //
  // Only allowed when:
  //
  // - Email verified
  // - Mobile verified
  // - Completion happens within 15 minutes
  //
  // ==========================================================

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeRegistration(
    @Body() dto: CompleteArtistRegistrationDto,
  ) {
    return this.artistRegistrationService.completeRegistration(dto);
  }
}