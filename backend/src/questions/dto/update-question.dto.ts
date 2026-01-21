import { IsString, IsOptional, IsIn, IsUUID, IsBoolean } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  questionImageUrl?: string;

  @IsOptional()
  @IsString()
  questionImageKey?: string;

  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D', 'E'])
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | 'E';

  @IsOptional()
  @IsString()
  solutionNote?: string;

  @IsOptional()
  @IsString()
  solutionImageUrl?: string;

  @IsOptional()
  @IsString()
  solutionImageKey?: string;

  @IsOptional()
  @IsString()
  aiSolution?: string;

  @IsOptional()
  @IsBoolean()
  isAiSolved?: boolean;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;
}
