import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class PremiumPlanDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsString() @MaxLength(1000) description!: string;
  @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @Type(() => Number) @IsInt() @Min(1) durationDays!: number;
  @IsIn(['ACTIVE', 'INACTIVE']) status!: 'ACTIVE' | 'INACTIVE';
}
