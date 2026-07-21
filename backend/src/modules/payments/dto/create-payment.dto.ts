import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  clientRequestId?: string;

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
