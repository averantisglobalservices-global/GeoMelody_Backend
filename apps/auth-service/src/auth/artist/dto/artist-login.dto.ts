import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class ArtistLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]+$/, {
    message: 'Mobile must contain only numbers.',
  })
  mobile?: string;
}