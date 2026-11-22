
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class OtherSocialProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  logo?: string | null;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2000)
  url!: string;
}

export class UpdateArtistSocialDto {
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? null
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  facebook?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? null
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  instagram?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? null
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  tiktok?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? null
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  youtube?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherSocialProfileDto)
  others?: OtherSocialProfileDto[];
}
