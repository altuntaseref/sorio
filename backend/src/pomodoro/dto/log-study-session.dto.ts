import {
  IsNumber,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class LogStudySessionDto {
  @IsNumber()
  @Min(1)
  @Max(480) // Maksimum 8 saat
  duration: number; // Kaç dakika sürdü?

  @IsUUID()
  @IsOptional()
  subjectId?: string; // Hangi derse çalıştı? (Opsiyonel)

  @IsDateString()
  startedAt: string; // ISO 8601 formatında

  @IsDateString()
  endedAt: string; // ISO 8601 formatında

  @IsIn(['COMPLETED', 'ABORTED'])
  @IsOptional()
  status?: 'COMPLETED' | 'ABORTED'; // Yarıda mı kesti, bitirdi mi? (default: COMPLETED)
}


