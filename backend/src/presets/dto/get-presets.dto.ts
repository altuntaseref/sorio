import { IsOptional, IsIn } from 'class-validator';

export class GetPresetsDto {
  @IsOptional()
  @IsIn(['POMODORO', 'FREE_TIMER'])
  timerType?: 'POMODORO' | 'FREE_TIMER'; // Filtreleme için (opsiyonel)
}
