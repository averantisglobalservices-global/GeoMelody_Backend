import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { ArtistLoginDto } from '../dto/artist-login.dto';
import { VerifyArtistLoginOtpDto } from '../dto/verify-artist-login-otp.dto';

import { ArtistLoginService } from '../services/artist-login.service';

@Controller('api/v1/artist')
export class ArtistLoginController {
  constructor(
    private readonly artistLoginService: ArtistLoginService,
  ) {}

  // ==========================================================
  // REQUEST LOGIN OTP
  // ==========================================================

  @Post('login')
  async login(
    @Body() dto: ArtistLoginDto,
  ) {
    return this.artistLoginService.login(dto);
  }

  // ==========================================================
  // VERIFY LOGIN OTP
  // ==========================================================

  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyArtistLoginOtpDto,
  ) {
    return this.artistLoginService.verifyOtp(dto);
  }
}