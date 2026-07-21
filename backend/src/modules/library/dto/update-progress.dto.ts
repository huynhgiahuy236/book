import { IsInt, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  chapter!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  percent!: number;
}
