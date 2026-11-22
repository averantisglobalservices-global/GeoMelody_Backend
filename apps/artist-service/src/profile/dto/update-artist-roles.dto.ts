import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class UpdateArtistRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  artistRoleIds!: string[];
}