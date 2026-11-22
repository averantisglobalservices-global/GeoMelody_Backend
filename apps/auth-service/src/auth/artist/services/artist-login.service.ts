import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';

import { ArtistLoginDto } from '../dto/artist-login.dto';
import { VerifyArtistLoginOtpDto } from '../dto/verify-artist-login-otp.dto';

import { RegistrationOtpService } from './registration-otp.service';

import { AuthTokenService } from '../../services/auth-token.service';

@Injectable()
export class ArtistLoginService {
  private readonly OTP_EXPIRY_MINUTES = 2;
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    private readonly database: DatabaseService,
    private readonly otpService: RegistrationOtpService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  // ==========================================================
  // REQUEST ARTIST LOGIN OTP
  // ==========================================================

  async login(dto: ArtistLoginDto) {
    const email =
      dto.email?.trim().toLowerCase();

    const countryCode =
      dto.countryCode?.trim();

    const mobile =
      dto.mobile?.trim();

    const hasEmail =
      Boolean(email);

    const hasMobile =
      Boolean(countryCode) &&
      Boolean(mobile);

    // ----------------------------------------------------------
    // VALIDATE LOGIN METHOD
    // ----------------------------------------------------------

    if (!hasEmail && !hasMobile) {
      throw new BadRequestException(
        'Provide either email or countryCode and mobile.',
      );
    }

    if (hasEmail && hasMobile) {
      throw new BadRequestException(
        'Provide either email or mobile, not both.',
      );
    }

    // ----------------------------------------------------------
    // FIND USER
    // ----------------------------------------------------------

    const user = hasEmail
      ? await this.database.user.findUnique({
          where: {
            email: email!,
          },
          include: {
            role: true,
          },
        })
      : await this.database.user.findFirst({
          where: {
            countryCode: countryCode!,
            mobile: mobile!,
          },
          include: {
            role: true,
          },
        });

    // ----------------------------------------------------------
    // USER MUST EXIST
    // ----------------------------------------------------------

    if (!user) {
      throw new UnauthorizedException(
        'Invalid login credentials.',
      );
    }

    // ----------------------------------------------------------
    // USER STATUS
    // ----------------------------------------------------------

    if (user.status !== 1) {
      throw new UnauthorizedException(
        'User account is inactive.',
      );
    }

    if (user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deleted.',
      );
    }

    // ----------------------------------------------------------
    // ROLE MUST EXIST
    // ----------------------------------------------------------

    if (!user.role) {
      throw new UnauthorizedException(
        'User role is not configured.',
      );
    }

    // ----------------------------------------------------------
    // ROLE MUST BE ACTIVE
    // ----------------------------------------------------------

    if (user.role.status !== 1) {
      throw new UnauthorizedException(
        'User role is inactive.',
      );
    }

    // ----------------------------------------------------------
    // MUST BE ARTIST
    // ----------------------------------------------------------

    if (user.role.code !== 'ARTIST') {
      throw new UnauthorizedException(
        'Artist account required.',
      );
    }

    // ==========================================================
    // GENERATE OTP
    // ==========================================================

    const otp =
      this.otpService.generateOtp();

    const otpHash =
      await this.otpService.hashOtp(otp);

    const expiresAt = new Date(
      Date.now() +
        this.OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    // ==========================================================
    // SAVE LOGIN OTP
    // ==========================================================

    const loginOtp =
      await this.database.artistLoginOtp.create({
        data: {
          email: hasEmail
            ? email
            : undefined,

          countryCode: hasMobile
            ? countryCode
            : undefined,

          mobile: hasMobile
            ? mobile
            : undefined,

          otpHash,
          expiresAt,
        },
      });

    // ==========================================================
    // SEND OTP
    // ==========================================================

    if (hasEmail) {
      await this.otpService.sendEmailOtp(
        email!,
        otp,
      );
    } else {
      await this.otpService.sendMobileOtp(
        countryCode!,
        mobile!,
        otp,
      );
    }

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return {
      success: true,

      message:
        'OTP sent successfully.',

      loginId:
        loginOtp.id,

      // Development / Postman only.
      // Remove this before production.
      otp,

      otpExpiresAt:
        expiresAt,

      nextStep:
        'VERIFY_OTP',
    };
  }

  // ==========================================================
  // VERIFY ARTIST LOGIN OTP
  // ==========================================================

  async verifyOtp(
    dto: VerifyArtistLoginOtpDto,
  ) {
    // ----------------------------------------------------------
    // FIND OTP
    // ----------------------------------------------------------

    const loginOtp =
      await this.database.artistLoginOtp.findUnique({
        where: {
          id: dto.loginId,
        },
      });

    if (!loginOtp) {
      throw new UnauthorizedException(
        'Invalid login request.',
      );
    }

    // ----------------------------------------------------------
    // OTP ALREADY USED
    // ----------------------------------------------------------

    if (loginOtp.verifiedAt) {
      throw new BadRequestException(
        'OTP has already been used.',
      );
    }

    // ----------------------------------------------------------
    // OTP EXPIRED
    // ----------------------------------------------------------

    if (
      loginOtp.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException(
        'OTP has expired.',
      );
    }

    // ----------------------------------------------------------
    // MAX ATTEMPTS
    // ----------------------------------------------------------

    if (
      loginOtp.attempts >=
      this.MAX_OTP_ATTEMPTS
    ) {
      throw new UnauthorizedException(
        'Maximum OTP attempts exceeded.',
      );
    }

    // ==========================================================
    // COMPARE OTP
    // ==========================================================

    const valid =
      await this.otpService.compareOtp(
        dto.otp,
        loginOtp.otpHash,
      );

    if (!valid) {
      await this.database.artistLoginOtp.update({
        where: {
          id: loginOtp.id,
        },

        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new UnauthorizedException(
        'Invalid OTP.',
      );
    }

    // ==========================================================
    // FIND ARTIST USER
    // ==========================================================

    const user = loginOtp.email
      ? await this.database.user.findUnique({
          where: {
            email: loginOtp.email,
          },
          include: {
            role: true,
          },
        })
      : await this.database.user.findFirst({
          where: {
            countryCode:
              loginOtp.countryCode!,
            mobile:
              loginOtp.mobile!,
          },
          include: {
            role: true,
          },
        });

    // ----------------------------------------------------------
    // USER NOT FOUND
    // ----------------------------------------------------------

    if (!user) {
      throw new UnauthorizedException(
        'Artist account not found.',
      );
    }

    // ==========================================================
    // VALIDATE USER AGAIN
    // ==========================================================

    if (user.status !== 1) {
      throw new UnauthorizedException(
        'User account is inactive.',
      );
    }

    if (user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deleted.',
      );
    }

    if (!user.role) {
      throw new UnauthorizedException(
        'User role is not configured.',
      );
    }

    if (user.role.status !== 1) {
      throw new UnauthorizedException(
        'User role is inactive.',
      );
    }

    // ----------------------------------------------------------
    // IMPORTANT:
    // Verify role again after OTP.
    // ----------------------------------------------------------

    if (user.role.code !== 'ARTIST') {
      throw new UnauthorizedException(
        'Artist account required.',
      );
    }

    // ==========================================================
    // MARK OTP USED + UPDATE LAST LOGIN
    // ==========================================================

    await this.database.$transaction([
      this.database.artistLoginOtp.update({
        where: {
          id: loginOtp.id,
        },

        data: {
          verifiedAt: new Date(),
        },
      }),

      this.database.user.update({
        where: {
          id: user.id,
        },

        data: {
          lastLoginAt: new Date(),
        },
      }),
    ]);

    // ==========================================================
    // CREATE ACCESS + REFRESH TOKENS
    // ==========================================================

    const tokens =
      await this.authTokenService.createTokens(
        user,
      );

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return {
      success: true,

      message:
        'Login successful.',

      user: {
        id: user.id,

        email:
          user.email,

        countryCode:
          user.countryCode,

        mobile:
          user.mobile,

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        role:
          user.role.code,
      },

      tokens: {
        accessToken:
          tokens.accessToken,

        refreshToken:
          tokens.refreshToken,
      },
    };
  }
}