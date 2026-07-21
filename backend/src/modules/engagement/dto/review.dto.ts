import {
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Max,
} from 'class-validator';

export class ReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsString() @MinLength(3) @MaxLength(1200) content!: string;
}
