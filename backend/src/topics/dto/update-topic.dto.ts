import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
