import { IsIn, IsOptional, IsString } from 'class-validator';

export class AnalysisRangeDto {
  @IsOptional()
  @IsString()
  @IsIn(['week', 'month', 'all'])
  range: 'week' | 'month' | 'all' = 'week';
}

