import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '@geomelody/database';

import {
  ArtistRegistrationStatus,
} from '../../../../../../generated/prisma/client';

import { StartRegistrationDto } from '../dto/start-registration.dto';
import { VerifyArtistEmailDto } from '../dto/verify-email-otp.dto';
import { VerifyArtistMobileDto } from '../dto/verify-mobile-otp.dto';
import { CompleteArtistRegistrationDto } from '../dto/complete-registration.dto';

import { RegistrationOtpService } from './registration-otp.service';
import { AuthTokenService } from '../../services/auth-token.service';

@Injectable()
export class ArtistRegistrationService {
  private readonly OTP_EXPIRY_MINUTES = 2;

  private readonly REGISTRATION_EXPIRY_MINUTES = 15;

  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    private readonly database: DatabaseService,
    private readonly otpService: RegistrationOtpService,
    private readonly authTokenService: AuthTokenService,
  ) { }

  // ==========================================================
  // START / CONTINUE REGISTRATION
  // ==========================================================

  async startRegistration(
    dto: StartRegistrationDto,
  ) {
    const hasEmail = Boolean(dto.email);

    const hasMobile = Boolean(
      dto.countryCode && dto.mobile,
    );

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!hasEmail && !hasMobile) {
      throw new BadRequestException(
        'Provide either email or countryCode and mobile.',
      );
    }

    if (hasEmail && hasMobile) {
      throw new BadRequestException(
        'Provide either email or mobile in one request.',
      );
    }

    // --------------------------------------------------------
    // FIRST REGISTRATION
    // --------------------------------------------------------

    if (!dto.registrationId) {
      return this.createRegistration(dto);
    }

    // --------------------------------------------------------
    // CONTINUE EXISTING REGISTRATION
    // --------------------------------------------------------

    return this.continueRegistration(dto);
  }

  // ==========================================================
  // CREATE NEW REGISTRATION
  // ==========================================================

  private async createRegistration(
    dto: StartRegistrationDto,
  ) {
    const hasEmail = Boolean(dto.email);
    const hasMobile = Boolean(
      dto.countryCode && dto.mobile,
    );

    // --------------------------------------------------------
    // VALIDATE INPUT
    // --------------------------------------------------------

    if (!hasEmail && !hasMobile) {
      throw new BadRequestException(
        'Provide email or countryCode and mobile.',
      );
    }

    if (hasEmail && hasMobile) {
      throw new BadRequestException(
        'Provide either email or mobile, not both.',
      );
    }

    // ========================================================
    // EMAIL FLOW
    // ========================================================

    if (hasEmail && dto.email) {
      const email = dto.email.trim().toLowerCase();

      // ------------------------------------------------------
      // CHECK EXISTING USER
      // ------------------------------------------------------

      const existingUser =
        await this.database.user.findUnique({
          where: {
            email,
          },
        });

      if (existingUser) {
        throw new ConflictException(
          'This email is already registered.',
        );
      }

      // ------------------------------------------------------
      // CHECK EXISTING REGISTRATION
      // ------------------------------------------------------

      let existingRegistration =
        await this.database.artistRegistration.findFirst({
          where: {
            email,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      // ------------------------------------------------------
      // COMPLETED REGISTRATION
      // ------------------------------------------------------

      if (
        existingRegistration &&
        existingRegistration.status ===
        ArtistRegistrationStatus.COMPLETED
      ) {
        throw new ConflictException(
          'Registration is already completed.',
        );
      }

      // ------------------------------------------------------
      // GENERATE NEW OTP
      // ------------------------------------------------------

      const otp =
        this.otpService.generateOtp();

      const emailOtpHash =
        await this.otpService.hashOtp(otp);

      const emailOtpExpiresAt =
        new Date(
          Date.now() +
          this.OTP_EXPIRY_MINUTES *
          60 *
          1000,
        );

      // ------------------------------------------------------
      // CREATE OR RESET REGISTRATION
      // ------------------------------------------------------

      let registration;

      if (
        existingRegistration &&
        existingRegistration.status ===
        ArtistRegistrationStatus.EXPIRED
      ) {
        // Reuse expired registration
        registration =
          await this.database.artistRegistration.update({
            where: {
              id: existingRegistration.id,
            },

            data: {
              email,

              status:
                ArtistRegistrationStatus.PENDING_VERIFICATION,

              emailVerified: false,
              mobileVerified: false,

              emailVerifiedAt: null,
              mobileVerifiedAt: null,

              emailOtpHash,
              emailOtpExpiresAt,
              emailOtpAttempts: 0,

              mobileOtpHash: null,
              mobileOtpExpiresAt: null,
              mobileOtpAttempts: 0,

              verificationCompletedAt: null,
              expiresAt: null,
              completedAt: null,
              userId: null,
            },
          });
      } else if (existingRegistration) {
        // Existing registration still active.
        // Generate a fresh OTP and reuse it.

        registration =
          await this.database.artistRegistration.update({
            where: {
              id: existingRegistration.id,
            },

            data: {
              email,

              emailVerified: false,
              emailVerifiedAt: null,

              emailOtpHash,
              emailOtpExpiresAt,
              emailOtpAttempts: 0,

              status:
                ArtistRegistrationStatus.PENDING_VERIFICATION,
            },
          });
      } else {
        // Create brand-new registration

        registration =
          await this.database.artistRegistration.create({
            data: {
              email,

              status:
                ArtistRegistrationStatus.PENDING_VERIFICATION,

              emailVerified: false,
              mobileVerified: false,

              emailOtpHash,
              emailOtpExpiresAt,
              emailOtpAttempts: 0,
            },
          });
      }

      // ------------------------------------------------------
      // SEND EMAIL OTP
      // ------------------------------------------------------

      await this.otpService.sendEmailOtp(
        email,
        otp,
      );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return {
        success: true,

        message:
          'Email OTP has been sent successfully.',

        registrationId:
          registration.id,

        email:
          registration.email,

        // Development / Postman testing only
        otp,

        otpExpiresAt:
          registration.emailOtpExpiresAt,

        nextStep:
          'VERIFY_EMAIL',
      };
    }

    // ========================================================
    // MOBILE FLOW
    // ========================================================

    if (
      hasMobile &&
      dto.countryCode &&
      dto.mobile
    ) {
      const countryCode =
        dto.countryCode.trim();

      const mobile =
        dto.mobile.trim();

      // ------------------------------------------------------
      // CHECK EXISTING USER
      // ------------------------------------------------------

      const existingUser =
        await this.database.user.findFirst({
          where: {
            countryCode,
            mobile,
          },
        });

      if (existingUser) {
        throw new ConflictException(
          'This mobile number is already registered.',
        );
      }

      // ------------------------------------------------------
      // CHECK EXISTING REGISTRATION
      // ------------------------------------------------------

      let existingRegistration =
        await this.database.artistRegistration.findFirst({
          where: {
            countryCode,
            mobile,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      // ------------------------------------------------------
      // COMPLETED REGISTRATION
      // ------------------------------------------------------

      if (
        existingRegistration &&
        existingRegistration.status ===
        ArtistRegistrationStatus.COMPLETED
      ) {
        throw new ConflictException(
          'Registration is already completed.',
        );
      }

      // ------------------------------------------------------
      // GENERATE NEW OTP
      // ------------------------------------------------------

      const otp =
        this.otpService.generateOtp();

      const mobileOtpHash =
        await this.otpService.hashOtp(otp);

      const mobileOtpExpiresAt =
        new Date(
          Date.now() +
          this.OTP_EXPIRY_MINUTES *
          60 *
          1000,
        );

      // ------------------------------------------------------
      // CREATE OR RESET REGISTRATION
      // ------------------------------------------------------

      let registration;

      if (
        existingRegistration &&
        existingRegistration.status ===
        ArtistRegistrationStatus.EXPIRED
      ) {
        // Reuse expired registration

        registration =
          await this.database.artistRegistration.update({
            where: {
              id: existingRegistration.id,
            },

            data: {
              countryCode,
              mobile,

              status:
                ArtistRegistrationStatus.PENDING_VERIFICATION,

              emailVerified: false,
              mobileVerified: false,

              emailVerifiedAt: null,
              mobileVerifiedAt: null,

              emailOtpHash: null,
              emailOtpExpiresAt: null,
              emailOtpAttempts: 0,

              mobileOtpHash,
              mobileOtpExpiresAt,
              mobileOtpAttempts: 0,

              verificationCompletedAt: null,
              expiresAt: null,
              completedAt: null,
              userId: null,
            },
          });
      } else if (existingRegistration) {
        // Existing registration still active.
        // Generate fresh mobile OTP.

        registration =
          await this.database.artistRegistration.update({
            where: {
              id: existingRegistration.id,
            },

            data: {
              countryCode,
              mobile,

              mobileVerified: false,
              mobileVerifiedAt: null,

              mobileOtpHash,
              mobileOtpExpiresAt,
              mobileOtpAttempts: 0,

              status:
                ArtistRegistrationStatus.PENDING_VERIFICATION,
            },
          });
      } else {
        // Create brand-new registration

        registration =
          await this.database.artistRegistration.create({
            data: {
              countryCode,
              mobile,

              status:
                ArtistRegistrationStatus.PENDING_VERIFICATION,

              mobileVerified: false,

              mobileOtpHash,
              mobileOtpExpiresAt,
              mobileOtpAttempts: 0,
            },
          });
      }

      // ------------------------------------------------------
      // SEND MOBILE OTP
      // ------------------------------------------------------

      await this.otpService.sendMobileOtp(
        countryCode,
        mobile,
        otp,
      );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return {
        success: true,

        message:
          'Mobile OTP has been sent successfully.',

        registrationId:
          registration.id,

        countryCode:
          registration.countryCode,

        mobile:
          registration.mobile,

        // Development / Postman testing only
        otp,

        otpExpiresAt:
          registration.mobileOtpExpiresAt,

        nextStep:
          'VERIFY_MOBILE',
      };
    }

    throw new BadRequestException(
      'Invalid registration request.',
    );
  }

  // ==========================================================
  // CONTINUE EXISTING REGISTRATION
  // ==========================================================

  private async continueRegistration(
    dto: StartRegistrationDto,
  ) {
    if (!dto.registrationId) {
      throw new BadRequestException(
        'Registration ID is required.',
      );
    }

    const registration =
      await this.database.artistRegistration.findUnique({
        where: {
          id: dto.registrationId,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found.',
      );
    }

    // --------------------------------------------------------
    // EXPIRED
    // --------------------------------------------------------

    if (
      registration.status ===
      ArtistRegistrationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Registration has expired. Please wait and start again.',
      );
    }

    // --------------------------------------------------------
    // COMPLETED
    // --------------------------------------------------------

    if (
      registration.status ===
      ArtistRegistrationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Registration is already completed.',
      );
    }

    // --------------------------------------------------------
    // ADD EMAIL
    // --------------------------------------------------------

    if (dto.email) {
      if (registration.email) {
        throw new BadRequestException(
          'Email is already added to this registration.',
        );
      }

      const existingUser =
        await this.database.user.findUnique({
          where: {
            email: dto.email,
          },
        });

      if (existingUser) {
        throw new ConflictException(
          'This email is already registered.',
        );
      }

      const existingRegistration =
        await this.database.artistRegistration.findFirst({
          where: {
            email: dto.email,

            id: {
              not: registration.id,
            },

            status: {
              not: ArtistRegistrationStatus.COMPLETED,
            },
          },
        });

      if (existingRegistration) {
        throw new ConflictException(
          'This email is already being used for registration.',
        );
      }

      const otp = this.otpService.generateOtp();

      const emailOtpHash =
        await this.otpService.hashOtp(otp);

      const emailOtpExpiresAt = new Date(
        Date.now() +
        this.OTP_EXPIRY_MINUTES *
        60 *
        1000,
      );

      const updatedRegistration =
        await this.database.artistRegistration.update({
          where: {
            id: registration.id,
          },

          data: {
            email: dto.email,

            emailVerified: false,

            emailVerifiedAt: null,

            emailOtpHash,

            emailOtpExpiresAt,

            emailOtpAttempts: 0,
          },
        });

      await this.otpService.sendEmailOtp(
        dto.email,
        otp,
      );

      return {
        success: true,

        message:
          'Email OTP has been sent successfully.',

        registrationId:
          updatedRegistration.id,

        email:
          updatedRegistration.email,
        // Development / Postman testing only
        otp,

        otpExpiresAt:
          updatedRegistration.emailOtpExpiresAt,

        nextStep: 'VERIFY_EMAIL',

      };
    }

    // --------------------------------------------------------
    // ADD MOBILE
    // --------------------------------------------------------

    if (
      dto.countryCode &&
      dto.mobile
    ) {
      if (
        registration.countryCode ||
        registration.mobile
      ) {
        throw new BadRequestException(
          'Mobile number is already added to this registration.',
        );
      }

      const existingUser =
        await this.database.user.findFirst({
          where: {
            countryCode: dto.countryCode,
            mobile: dto.mobile,
          },
        });

      if (existingUser) {
        throw new ConflictException(
          'This mobile number is already registered.',
        );
      }

      const existingRegistration =
        await this.database.artistRegistration.findFirst({
          where: {
            countryCode: dto.countryCode,

            mobile: dto.mobile,

            id: {
              not: registration.id,
            },

            status: {
              not: ArtistRegistrationStatus.COMPLETED,
            },
          },
        });

      if (existingRegistration) {
        throw new ConflictException(
          'This mobile number is already being used for registration.',
        );
      }

      const otp = this.otpService.generateOtp();

      const mobileOtpHash =
        await this.otpService.hashOtp(otp);

      const mobileOtpExpiresAt = new Date(
        Date.now() +
        this.OTP_EXPIRY_MINUTES *
        60 *
        1000,
      );

      const updatedRegistration =
        await this.database.artistRegistration.update({
          where: {
            id: registration.id,
          },

          data: {
            countryCode: dto.countryCode,

            mobile: dto.mobile,

            mobileVerified: false,

            mobileVerifiedAt: null,

            mobileOtpHash,

            mobileOtpExpiresAt,

            mobileOtpAttempts: 0,
          },
        });

      await this.otpService.sendMobileOtp(
        dto.countryCode,
        dto.mobile,
        otp,
      );

      return {
        success: true,

        message:
          'Mobile OTP has been sent successfully.',

        registrationId:
          updatedRegistration.id,

        countryCode:
          updatedRegistration.countryCode,

        mobile:
          updatedRegistration.mobile,
        // Development / Postman testing only
        otp,

        otpExpiresAt:
          updatedRegistration.mobileOtpExpiresAt,

        nextStep: 'VERIFY_MOBILE',
      };
    }

    throw new BadRequestException(
      'Provide email or countryCode and mobile.',
    );
  }

  // ==========================================================
  // VERIFY EMAIL OTP
  // ==========================================================

  async verifyEmailOtp(
    dto: VerifyArtistEmailDto,
  ) {
    const registration =
      await this.database.artistRegistration.findUnique({
        where: {
          id: dto.registrationId,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found.',
      );
    }

    if (
      registration.status ===
      ArtistRegistrationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Registration has expired.',
      );
    }

    if (
      registration.status ===
      ArtistRegistrationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Registration is already completed.',
      );
    }

    if (!registration.email) {
      throw new BadRequestException(
        'Email is not available for this registration.',
      );
    }

    if (registration.emailVerified) {
      return {
        success: true,

        message:
          'Email is already verified.',

        registrationId: registration.id,

        emailVerified: true,

        mobileVerified:
          registration.mobileVerified,

        nextStep:
          registration.mobileVerified
            ? 'COMPLETE_REGISTRATION'
            : 'ADD_AND_VERIFY_MOBILE',
      };
    }

    if (
      !registration.emailOtpHash ||
      !registration.emailOtpExpiresAt
    ) {
      throw new BadRequestException(
        'Email OTP is not available.',
      );
    }

    if (
      registration.emailOtpExpiresAt <
      new Date()
    ) {
      throw new BadRequestException(
        'Email OTP has expired.',
      );
    }

    if (
      registration.emailOtpAttempts >=
      this.MAX_OTP_ATTEMPTS
    ) {
      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    const isOtpValid =
      await this.otpService.compareOtp(
        dto.otp,
        registration.emailOtpHash,
      );

    if (!isOtpValid) {
      await this.database.artistRegistration.update({
        where: {
          id: registration.id,
        },

        data: {
          emailOtpAttempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException(
        'Invalid email OTP.',
      );
    }

    const updatedRegistration =
      await this.database.artistRegistration.update({
        where: {
          id: registration.id,
        },

        data: {
          emailVerified: true,

          emailVerifiedAt: new Date(),

          emailOtpHash: null,

          emailOtpExpiresAt: null,

          emailOtpAttempts: 0,

          status:
            registration.mobileVerified
              ? ArtistRegistrationStatus.READY_TO_COMPLETE
              : ArtistRegistrationStatus.EMAIL_VERIFIED,
        },
      });

    return this.handleVerificationCompletion(
      updatedRegistration.id,
    );
  }

  // ==========================================================
  // VERIFY MOBILE OTP
  // ==========================================================

  async verifyMobileOtp(
    dto: VerifyArtistMobileDto,
  ) {
    const registration =
      await this.database.artistRegistration.findUnique({
        where: {
          id: dto.registrationId,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found.',
      );
    }

    if (
      registration.status ===
      ArtistRegistrationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Registration has expired.',
      );
    }

    if (
      registration.status ===
      ArtistRegistrationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Registration is already completed.',
      );
    }

    if (
      !registration.countryCode ||
      !registration.mobile
    ) {
      throw new BadRequestException(
        'Mobile number is not available for this registration.',
      );
    }

    if (registration.mobileVerified) {
      return {
        success: true,

        message:
          'Mobile number is already verified.',

        registrationId: registration.id,

        emailVerified:
          registration.emailVerified,

        mobileVerified: true,

        nextStep:
          registration.emailVerified
            ? 'COMPLETE_REGISTRATION'
            : 'ADD_AND_VERIFY_EMAIL',
      };
    }

    if (
      !registration.mobileOtpHash ||
      !registration.mobileOtpExpiresAt
    ) {
      throw new BadRequestException(
        'Mobile OTP is not available.',
      );
    }

    if (
      registration.mobileOtpExpiresAt <
      new Date()
    ) {
      throw new BadRequestException(
        'Mobile OTP has expired.',
      );
    }

    if (
      registration.mobileOtpAttempts >=
      this.MAX_OTP_ATTEMPTS
    ) {
      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    const isOtpValid =
      await this.otpService.compareOtp(
        dto.otp,
        registration.mobileOtpHash,
      );

    if (!isOtpValid) {
      await this.database.artistRegistration.update({
        where: {
          id: registration.id,
        },

        data: {
          mobileOtpAttempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException(
        'Invalid mobile OTP.',
      );
    }

    const updatedRegistration =
      await this.database.artistRegistration.update({
        where: {
          id: registration.id,
        },

        data: {
          mobileVerified: true,

          mobileVerifiedAt: new Date(),

          mobileOtpHash: null,

          mobileOtpExpiresAt: null,

          mobileOtpAttempts: 0,

          status:
            registration.emailVerified
              ? ArtistRegistrationStatus.READY_TO_COMPLETE
              : ArtistRegistrationStatus.MOBILE_VERIFIED,
        },
      });

    return this.handleVerificationCompletion(
      updatedRegistration.id,
    );
  }

  // ==========================================================
  // HANDLE BOTH VERIFICATIONS
  // ==========================================================

  private async handleVerificationCompletion(
    registrationId: string,
  ) {
    const registration =
      await this.database.artistRegistration.findUnique({
        where: {
          id: registrationId,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found.',
      );
    }

    // --------------------------------------------------------
    // BOTH VERIFIED
    // START 15 MINUTE TIMER
    // --------------------------------------------------------

    if (
      registration.emailVerified &&
      registration.mobileVerified
    ) {
      let expiresAt =
        registration.expiresAt;

      if (!expiresAt) {
        expiresAt = new Date(
          Date.now() +
          this.REGISTRATION_EXPIRY_MINUTES *
          60 *
          1000,
        );

        await this.database.artistRegistration.update({
          where: {
            id: registration.id,
          },

          data: {
            verificationCompletedAt:
              new Date(),

            expiresAt,

            status:
              ArtistRegistrationStatus.READY_TO_COMPLETE,
          },
        });
      }

      return {
        success: true,

        message:
          'Email and mobile number verified successfully. Complete your registration within 15 minutes.',

        registrationId: registration.id,

        emailVerified: true,

        mobileVerified: true,

        expiresAt,

        nextStep:
          'COMPLETE_REGISTRATION',
      };
    }

    // --------------------------------------------------------
    // ONLY EMAIL VERIFIED
    // --------------------------------------------------------

    if (registration.emailVerified) {
      return {
        success: true,

        message:
          'Email verified successfully.',

        registrationId:
          registration.id,

        emailVerified: true,

        mobileVerified: false,

        nextStep:
          'ADD_AND_VERIFY_MOBILE',
      };
    }

    // --------------------------------------------------------
    // ONLY MOBILE VERIFIED
    // --------------------------------------------------------

    return {
      success: true,

      message:
        'Mobile number verified successfully.',

      registrationId:
        registration.id,

      emailVerified: false,

      mobileVerified: true,

      nextStep:
        'ADD_AND_VERIFY_EMAIL',
    };
  }

  // ==========================================================
  // COMPLETE REGISTRATION
  // ==========================================================

  async completeRegistration(
    dto: CompleteArtistRegistrationDto,
  ) {
    const registration =
      await this.database.artistRegistration.findUnique({
        where: {
          id: dto.registrationId,
        },
      });

    if (!registration) {
      throw new NotFoundException(
        'Registration not found.',
      );
    }

    // --------------------------------------------------------
    // ALREADY COMPLETED
    // --------------------------------------------------------

    if (
      registration.status ===
      ArtistRegistrationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Registration is already completed.',
      );
    }

    // --------------------------------------------------------
    // BOTH MUST BE VERIFIED
    // --------------------------------------------------------

    if (
      !registration.emailVerified ||
      !registration.mobileVerified
    ) {
      throw new BadRequestException(
        'Email and mobile number must both be verified.',
      );
    }

    // --------------------------------------------------------
    // CHECK 15 MINUTE EXPIRY
    // --------------------------------------------------------

    if (
      !registration.expiresAt ||
      registration.expiresAt < new Date()
    ) {
      await this.database.artistRegistration.update({
        where: {
          id: registration.id,
        },

        data: {
          status:
            ArtistRegistrationStatus.EXPIRED,
        },
      });

      throw new BadRequestException(
        'Registration completion time has expired.',
      );
    }

    // --------------------------------------------------------
    // NON-NULL VALUES
    // --------------------------------------------------------

    if (!registration.email) {
      throw new BadRequestException(
        'Verified email is required.',
      );
    }

    if (
      !registration.countryCode ||
      !registration.mobile
    ) {
      throw new BadRequestException(
        'Verified mobile number is required.',
      );
    }

    const verifiedEmail: string =
      registration.email;

    const verifiedCountryCode: string =
      registration.countryCode;

    const verifiedMobile: string =
      registration.mobile;

    // --------------------------------------------------------
    // FIND ARTIST ROLE
    // --------------------------------------------------------

    const artistRole =
      await this.database.role.findUnique({
        where: {
          code: 'ARTIST',
        },
      });

    if (!artistRole) {
      throw new NotFoundException(
        'ARTIST role is not configured.',
      );
    }

    // --------------------------------------------------------
    // CHECK EMAIL AGAIN
    // --------------------------------------------------------

    const existingUserByEmail =
      await this.database.user.findUnique({
        where: {
          email: verifiedEmail,
        },
      });

    if (existingUserByEmail) {
      throw new ConflictException(
        'Email is already registered.',
      );
    }

    // --------------------------------------------------------
    // CHECK MOBILE AGAIN
    // --------------------------------------------------------

    const existingUserByMobile =
      await this.database.user.findFirst({
        where: {
          countryCode:
            verifiedCountryCode,

          mobile:
            verifiedMobile,
        },
      });

    if (existingUserByMobile) {
      throw new ConflictException(
        'Mobile number is already registered.',
      );
    }

    // --------------------------------------------------------
    // CREATE USER + COMPLETE REGISTRATION
    // --------------------------------------------------------

    const result =
      await this.database.$transaction(
        async (tx) => {
          const user =
            await tx.user.create({
              data: {
                email: verifiedEmail,

                countryCode:
                  verifiedCountryCode,

                mobile:
                  verifiedMobile,

                firstName:
                  dto.firstName,

                lastName:
                  dto.lastName,

                emailVerified: true,

                mobileVerified: true,

                status: 1,

                profileCompletionPercentage: 25.00,

                roleId:
                  artistRole.id,
              },
            });

          const updatedRegistration =
            await tx.artistRegistration.update({
              where: {
                id: registration.id,
              },

              data: {
                title:
                  dto.title,

                firstName:
                  dto.firstName,

                lastName:
                  dto.lastName,

                gender:
                  dto.gender,

                dateOfBirth:
                  dto.dateOfBirth
                    ? new Date(
                      dto.dateOfBirth,
                    )
                    : null,

                countryId:
                  dto.countryId,

                cityId:
                  dto.cityId,

                userId:
                  user.id,

                completedAt:
                  new Date(),

                status:
                  ArtistRegistrationStatus.COMPLETED,
              },
            });

          return {
            user,
            registration:
              updatedRegistration,
          };
        },
      );

    const userWithRole =
      await this.database.user.findUnique({
        where: {
          id: result.user.id,
        },
        include: {
          role: true,
        },
      });

    if (!userWithRole || !userWithRole.role) {
      throw new NotFoundException(
        'User role could not be loaded.',
      );
    }

    const tokens =
      await this.authTokenService.createTokens(
        userWithRole,
      );

    return {
      success: true,

      message:
        'Artist registration completed successfully.',

      user: {
        id: userWithRole.id,
        email: userWithRole.email,
        countryCode: userWithRole.countryCode,
        mobile: userWithRole.mobile,
        firstName: userWithRole.firstName,
        lastName: userWithRole.lastName,
        role: userWithRole.role.code,
      },

      registration: {
        id: result.registration.id,
        status: result.registration.status,

      },
      profileCompletion: {
        percentage: userWithRole.profileCompletionPercentage,
        nextStep: 'PROFILE_COMPLETION',
      },

      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}