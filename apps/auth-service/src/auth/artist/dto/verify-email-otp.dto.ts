import {
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class VerifyArtistEmailDto {
  @IsString()
  @IsNotEmpty()
  registrationId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;
}