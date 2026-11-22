import {
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class VerifyArtistLoginOtpDto {
  @IsUUID()
  loginId!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;
}