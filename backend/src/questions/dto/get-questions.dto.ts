import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min, IsString } from 'class-validator';

export class GetQuestionsDto {
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsString()
  examCode?: string; // Hangi sınav için sorular (TYT, AYT_SAY, etc.)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
