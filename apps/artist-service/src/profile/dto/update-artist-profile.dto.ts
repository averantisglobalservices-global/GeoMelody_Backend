import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateArtistProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  stageName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string | null;
}