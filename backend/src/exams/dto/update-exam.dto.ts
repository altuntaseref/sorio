import { IsOptional, IsDateString } from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsDateString()
  examDate?: string; // YYYY-MM-DD formatında
}
