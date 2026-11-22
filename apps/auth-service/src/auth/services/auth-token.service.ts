import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@geomelody/database';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // CREATE ACCESS + REFRESH TOKENS
  // ============================================================

  async createTokens(user: {
    id: string;
    email: string | null;
    role: {
      code: string;
    };
  }) {
    // ----------------------------------------------------------
    // ACCESS TOKEN
    // ----------------------------------------------------------

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    // ----------------------------------------------------------
    // REFRESH TOKEN
    // ----------------------------------------------------------

    const refreshToken =
      this.generateRefreshToken();

    const refreshTokenHash =
      this.hashRefreshToken(refreshToken);

    const refreshExpiresAt =
      this.getRefreshTokenExpiry();

    await this.databaseService.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // ============================================================
  // GENERATE REFRESH TOKEN
  // ============================================================

  private generateRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  // ============================================================
  // HASH REFRESH TOKEN
  // ============================================================

  private hashRefreshToken(
    token: string,
  ): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  // ============================================================
  // REFRESH TOKEN EXPIRY
  // ============================================================

  private getRefreshTokenExpiry(): Date {
    const days =
      this.configService.get<number>(
        'JWT_REFRESH_EXPIRES_IN_DAYS',
      ) ?? 7;

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + days,
    );

    return expiresAt;
  }
}