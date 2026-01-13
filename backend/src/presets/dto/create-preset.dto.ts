import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string; // Örn: "Matematik Kampı", "Gece Çalışma"

  @IsIn(['POMODORO', 'FREE_TIMER'])
  timerType: 'POMODORO' | 'FREE_TIMER'; // Pomodoro mu, serbest timer mı?

  // Pomodoro'ya özel alanlar (sadece timerType='POMODORO' için)
  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  workDuration?: number; // Dakika (Pomodoro için, default: 25)

  @IsNumber()
  @Min(1)
  @Max(60)
  @IsOptional()
  breakDuration?: number; // Dakika (Pomodoro için, default: 5)

  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  longBreakDuration?: number; // Dakika (Pomodoro için, default: 15)

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  setsUntilLongBreak?: number; // Kaç sette bir uzun mola? (Pomodoro için, default: 4)

  // Ortak alanlar (hem Pomodoro hem Free Timer için)
  @IsUUID()
  @IsOptional()
  backgroundImageId?: string; // Asset ID (IMAGE veya VIDEO tipinde)

  @IsUUID()
  @IsOptional()
  soundId?: string; // Asset ID (SOUND tipinde)

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean; // Varsayılan olarak bu mu açılsın? (default: false)
}
