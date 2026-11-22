import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ArtistType } from '../../../../../generated/prisma/enums';

export class UpdateArtistIdentityDto {
  @IsOptional()
  @IsEnum(ArtistType)
  artistType?: ArtistType;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  stageName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string | null;
}