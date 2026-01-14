import { IsString, IsNumber, Min } from 'class-validator';

export class SetExamGoalDto {
  @IsString()
  examCode: string; // 'TYT', 'AYT_SAY', etc.

  @IsNumber()
  @Min(0)
  targetNet: number; // 95.00
}
