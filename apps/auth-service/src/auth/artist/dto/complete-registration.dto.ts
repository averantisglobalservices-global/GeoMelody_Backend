import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CompleteArtistRegistrationDto {
  @IsString()
  @IsNotEmpty()
  registrationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  gender!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsUUID()
  countryId!: string;

  @IsUUID()
  cityId!: string;
}