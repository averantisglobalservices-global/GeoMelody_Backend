import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegistrationOtpService {
  private readonly saltRounds = 10;

  generateOtp(): string {
    return Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, this.saltRounds);
  }

  async compareOtp(
    otp: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  async sendEmailOtp(
    email: string,
    otp: string,
  ): Promise<void> {
    console.log('');
    console.log('==============================');
    console.log('EMAIL OTP');
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log('==============================');
    console.log('');

    // Later integrate Magnific / SMTP / SendGrid etc.
  }

  async sendMobileOtp(
    countryCode: string,
    mobile: string,
    otp: string,
  ): Promise<void> {
    console.log('');
    console.log('==============================');
    console.log('MOBILE OTP');
    console.log(`Mobile: ${countryCode}${mobile}`);
    console.log(`OTP: ${otp}`);
    console.log('==============================');
    console.log('');

    // Later integrate Twilio / MSG91 / other SMS provider
  }
}