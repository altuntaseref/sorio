import {
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectResultDto {
  @IsString()
  subjectId: string;

  @IsNumber()
  @Min(0)
  correct: number;

  @IsNumber()
  @Min(0)
  wrong: number;

  @IsNumber()
  @Min(0)
  empty: number;
}

export class CreateMockExamDto {
  @IsString()
  examCode: string; // 'TYT', 'AYT_SAY', etc.

  @IsString()
  examName: string; // 'Özdebir Türkiye Geneli - 3'

  @IsDateString()
  examDate: string; // '2024-01-14'

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubjectResultDto)
  subjectResults: SubjectResultDto[];
}
