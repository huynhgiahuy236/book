import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

export class UpdateAdminBookDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) authors?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) categories?: string[];
  @IsOptional() @IsString() @MaxLength(180) publisher?: string;
  @IsOptional() @IsString() @MaxLength(12) language?: string;
  @IsOptional() @IsIn(['FREE', 'PREMIUM', 'PURCHASE']) accessType?:
    'FREE' | 'PREMIUM' | 'PURCHASE';
  @IsOptional() @IsIn(['ACTIVE', 'DRAFT', 'ARCHIVED']) status?:
    'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  @IsOptional() @IsBoolean() readingEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) ebookPrice?: number;
  @IsOptional() @IsNumber() @Min(0) physicalPrice?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
}
