import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class UpdateArtistGenresDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  genreIds!: string[];
}