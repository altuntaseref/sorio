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
  @Max(480)
  duration: number; // Dakika cinsinden

  @IsUUID()
  @IsOptional()
  subjectId?: string; // Hangi derse çalıştı? (Opsiyonel)

  @IsDateString()
  startedAt: string; // ISO 8601 formatında tarih

  @IsDateString()
  endedAt: string; // ISO 8601 formatında tarih

  @IsIn(['COMPLETED', 'ABORTED'])
  @IsOptional()
  status?: 'COMPLETED' | 'ABORTED'; // Yarıda mı kesti, bitirdi mi? (default: 'COMPLETED')

  @IsIn(['POMODORO', 'FREE_TIMER'])
  @IsOptional()
  timerType?: 'POMODORO' | 'FREE_TIMER'; // Pomodoro mu, serbest timer mı? (default: 'POMODORO')
}
