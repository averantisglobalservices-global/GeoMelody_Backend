import { IsUUID } from 'class-validator';

export class UpdateAdminUserRoleDto {
  @IsUUID()
  roleId!: string;
}