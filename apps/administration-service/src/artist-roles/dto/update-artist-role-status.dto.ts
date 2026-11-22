import { IsIn, IsInt } from 'class-validator';

export class UpdateArtistRoleStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number;
}