import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetWeeklyActivityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  weeks: number = 12;
}
