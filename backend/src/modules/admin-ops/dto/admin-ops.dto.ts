import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class AdminListDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 12;
}
export class RightActionDto {
  @IsString() userId!: string;
  @IsString() bookId!: string;
  @IsString() @MaxLength(500) reason!: string;
}
export class StatusActionDto {
  @IsIn([
    'PROCESSING',
    'SHIPPING',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
    'APPROVED',
    'REJECTED',
    'PUBLISHED',
    'HIDDEN',
  ])
  status!: string;
  @IsString() @MaxLength(500) reason!: string;
}
export class UserStatusDto {
  @IsIn(['ACTIVE', 'LOCKED']) status!: 'ACTIVE' | 'LOCKED';
  @IsString() reason!: string;
}
