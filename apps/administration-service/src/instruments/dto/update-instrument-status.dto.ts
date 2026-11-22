import {
  IsIn,
  IsInt,
} from 'class-validator';

export class UpdateInstrumentStatusDto {
  @IsInt()
  @IsIn([0, 1])
  status!: number;
}