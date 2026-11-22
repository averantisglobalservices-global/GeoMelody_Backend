import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class UpdateArtistInstrumentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  instrumentIds!: string[];
}