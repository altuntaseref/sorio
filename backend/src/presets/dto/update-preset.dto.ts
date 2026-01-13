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

export class UpdatePresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string; // Örn: "Matematik Kampı", "Gece Çalışma"

  // Pomodoro'ya özel alanlar (sadece timerType='POMODORO' için)
  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  workDuration?: number; // Dakika

  @IsNumber()
  @Min(1)
  @Max(60)
  @IsOptional()
  breakDuration?: number; // Dakika

  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  longBreakDuration?: number; // Dakika

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  setsUntilLongBreak?: number; // Kaç sette bir uzun mola?

  // Ortak alanlar
  @IsUUID()
  @IsOptional()
  backgroundImageId?: string | null; // Asset ID (null gönderilirse kaldırılır)

  @IsUUID()
  @IsOptional()
  soundId?: string | null; // Asset ID (null gönderilirse kaldırılır)

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean; // Varsayılan olarak bu mu açılsın?
}
