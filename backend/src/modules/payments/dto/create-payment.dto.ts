import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bookIds!: string[];

  @IsOptional()
  @IsEmail()
  buyerEmail?: string;

  @IsOptional()
  @IsString()
  buyerName?: string;
}
