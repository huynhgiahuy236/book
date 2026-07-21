import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  chapter?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percent?: number;

  @IsInt()
  @Min(1)
  currentPage!: number;

  @IsInt()
  @Min(1)
  totalPages!: number;
}
