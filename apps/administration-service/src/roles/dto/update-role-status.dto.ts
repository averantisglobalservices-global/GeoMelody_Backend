import { IsIn, IsInt } from 'class-validator';

export class UpdateRoleStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number;
}