import { IsIn, IsInt } from 'class-validator';

export class UpdateMusicGenreStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number;
}