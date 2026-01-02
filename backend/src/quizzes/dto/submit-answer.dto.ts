import { IsIn, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  @IsIn(['A', 'B', 'C', 'D', 'E'])
  userAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
}
