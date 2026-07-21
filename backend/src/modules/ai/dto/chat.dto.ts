import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  message!: string;
}
