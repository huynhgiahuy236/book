import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LinkPdfDto {
  @IsString()
  @MinLength(6)
  @MaxLength(1024)
  @Matches(/^ebooks\/.+\.pdf$/i)
  objectKey!: string;

  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean;
}

export class CreatePdfDraftDto extends LinkPdfDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;
}
