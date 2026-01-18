import { IsIn, IsArray, IsOptional, IsUUID } from 'class-validator';

export class StartQuizDto {
  @IsIn(['learning', 'wrong-answers'])
  mode: 'learning' | 'wrong-answers';

  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  subjectIds?: string[];

  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  topicIds?: string[];

  @IsOptional()
  @IsString()
  examCode?: string; // Hangi sınav için bu quiz (TYT, AYT_SAY, etc.)
}
