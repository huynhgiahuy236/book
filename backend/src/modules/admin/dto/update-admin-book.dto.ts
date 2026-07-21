import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateAdminBookDto {
  @IsOptional() @IsIn(['FREE', 'PREMIUM', 'PURCHASE']) accessType?:
    'FREE' | 'PREMIUM' | 'PURCHASE';
  @IsOptional() @IsIn(['ACTIVE', 'DRAFT', 'ARCHIVED']) status?:
    'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  @IsOptional() @IsBoolean() readingEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) ebookPrice?: number;
  @IsOptional() @IsNumber() @Min(0) physicalPrice?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
}
