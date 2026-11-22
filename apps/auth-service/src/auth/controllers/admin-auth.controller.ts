import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminLoginDto } from '../dto/admin-login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

import { AdminAuthService } from '../services/admin-auth.service';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('api/v1/admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
  ) {}

  // ==========================================================
  // LOGIN
  // ==========================================================

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.adminAuthService.refresh(
      dto.refreshToken,
    );
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    return this.adminAuthService.logout(
      dto.refreshToken,
    );
  }

  // ==========================================================
  // CURRENT SUPER ADMIN
  // ==========================================================

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMINISTRATOR')
  async me(@Req() request: any) {
    return this.adminAuthService.me(
      request.user.sub,
    );
  }
}