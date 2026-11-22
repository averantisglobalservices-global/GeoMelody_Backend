
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class BandMemberDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  designation?: string;
}

export class UpdateBandMembersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BandMemberDto)
  members!: BandMemberDto[];
}
