import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@geomelody/database';

import argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';

import { AdminLoginDto } from '../dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // LOGIN
  // ============================================================

  async login(dto: AdminLoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: {
        email: dto.email,
      },
      include: {
        role: true,
      },
    });

    // Don't reveal whether the email exists.
    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // Active account check
    if (user.status !== 1) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    // Soft-delete check
    if (user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deleted',
      );
    }

    // Role must exist
    if (!user.role) {
      throw new UnauthorizedException(
        'User role is not configured',
      );
    }

    // Role must be active
    if (user.role.status !== 1) {
      throw new UnauthorizedException(
        'User role is inactive',
      );
    }

    // Super Admin check
   if (!user.role.isAdmin) {
  throw new UnauthorizedException(
    'Administrator access required',
  );
}

    // Password check
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // Update last login
    await this.databaseService.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // ==========================================================
    // ACCESS TOKEN
    // ==========================================================

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    // ==========================================================
    // REFRESH TOKEN
    // ==========================================================

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
      message: 'Login successful',

      accessToken,

      refreshToken,

      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.code,
        status: user.status,
        emailVerified: user.emailVerified,
      },
    };
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is required',
      );
    }

    const tokenHash =
      this.hashRefreshToken(refreshToken);

    const storedToken =
      await this.databaseService.refreshToken.findFirst({
        where: {
          tokenHash,
        },
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    // Token already revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedException(
        'Refresh token has been revoked',
      );
    }

    // Token expired
    if (storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'Refresh token has expired',
      );
    }

    const user = storedToken.user;

    if (!user.role) {
      throw new UnauthorizedException(
        'User role is not configured',
      );
    }

    // User inactive
    if (user.status !== 1) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    // User soft deleted
    if (user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deleted',
      );
    }

    // Role inactive
    if (user.role.status !== 1) {
      throw new UnauthorizedException(
        'User role is inactive',
      );
    }

    // Super Admin check
    if (user.role.code !== 'SUPER_ADMINISTRATOR') {
      throw new UnauthorizedException(
        'Administrator access required',
      );
    }

    // ==========================================================
    // GENERATE NEW ACCESS TOKEN
    // ==========================================================

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    // ==========================================================
    // ROTATE REFRESH TOKEN
    // ==========================================================

    const newRefreshToken =
      this.generateRefreshToken();

    const newRefreshTokenHash =
      this.hashRefreshToken(newRefreshToken);

    const newRefreshExpiresAt =
      this.getRefreshTokenExpiry();

    await this.databaseService.$transaction([
      // Revoke old refresh token
      this.databaseService.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),

      // Create new refresh token
      this.databaseService.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newRefreshTokenHash,
          expiresAt: newRefreshExpiresAt,
        },
      }),
    ]);

    return {
      message: 'Token refreshed successfully',

      accessToken,

      refreshToken: newRefreshToken,
    };
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is required',
      );
    }

    const tokenHash =
      this.hashRefreshToken(refreshToken);

    const storedToken =
      await this.databaseService.refreshToken.findFirst({
        where: {
          tokenHash,
        },
      });

    // Idempotent logout
    if (!storedToken) {
      return {
        message: 'Logout successful',
      };
    }

    if (!storedToken.revokedAt) {
      await this.databaseService.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return {
      message: 'Logout successful',
    };
  }

  // ============================================================
  // CURRENT USER
  // ============================================================

  async me(userId: string) {
    const user =
      await this.databaseService.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          role: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    if (user.status !== 1) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    if (user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deleted',
      );
    }

    if (!user.role) {
      throw new UnauthorizedException(
        'User role is not configured',
      );
    }

    if (user.role.status !== 1) {
      throw new UnauthorizedException(
        'User role is inactive',
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.code,
      status: user.status,
      emailVerified: user.emailVerified,
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

  private hashRefreshToken(token: string): string {
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