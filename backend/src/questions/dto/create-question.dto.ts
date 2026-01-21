import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export enum CorrectAnswer {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
}

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsUrl()
  questionImageUrl: string;

  @IsNotEmpty()
  @IsString()
  questionImageKey: string;

  @IsNotEmpty()
  @IsEnum(CorrectAnswer)
  correctAnswer: CorrectAnswer;

  @IsOptional()
  @IsString()
  solutionNote?: string;

  @IsOptional()
  @IsUrl()
  solutionImageUrl?: string;

  @IsOptional()
  @IsString()
  solutionImageKey?: string;

  @IsNotEmpty()
  @IsUUID()
  subjectId: string;

  @IsNotEmpty()
  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  aiSolution?: string;

  @IsOptional()
  @IsBoolean()
  isAiSolved?: boolean;

  @IsOptional()
  @IsString()
  examCode?: string; // Hangi sınav için bu soru (TYT, AYT_SAY, etc.)
}
