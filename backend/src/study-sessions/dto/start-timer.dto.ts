import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsEnum,
} from 'class-validator';

export class StartTimerDto {
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsString()
  examCode?: string;

  @IsEnum(['POMODORO', 'FREE_TIMER'])
  timerType: 'POMODORO' | 'FREE_TIMER';

  @IsOptional()
  @IsUUID()
  presetId?: string; // Pomodoro için preset ID (opsiyonel)
}
