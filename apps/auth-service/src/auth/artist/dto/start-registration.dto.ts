import {
  IsEmail,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class StartRegistrationDto {
  @IsOptional()
  @IsString()
  registrationId?: string;

  @ValidateIf((o) => !o.mobile)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ValidateIf((o) => !o.email)
  @IsOptional()
  @IsString()
  mobile?: string;
}