import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GiftDto {
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;
  @IsIn(['PHYSICAL', 'DIGITAL']) type!: 'PHYSICAL' | 'DIGITAL';
  @Type(() => Number) @IsInt() @Min(0) stock!: number;
  @Type(() => Number) @IsInt() @Min(0) lowStockThreshold!: number;
  @IsIn(['ACTIVE', 'INACTIVE']) status!: 'ACTIVE' | 'INACTIVE';
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

export class ListGiftDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 12;
}
