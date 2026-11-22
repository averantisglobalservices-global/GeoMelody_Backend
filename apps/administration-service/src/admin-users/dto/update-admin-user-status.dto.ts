import { IsIn, IsInt } from 'class-validator';

export class UpdateAdminUserStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number;
}