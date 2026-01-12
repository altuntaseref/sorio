import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdatePomodoroPresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string; // Örn: "Matematik Kampı", "Chill", "Hardcore"

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

  @IsUUID()
  @IsOptional()
  backgroundImageId?: string; // PomodoroAsset ID (IMAGE veya VIDEO tipinde)

  @IsUUID()
  @IsOptional()
  soundId?: string; // PomodoroAsset ID (SOUND tipinde)

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean; // Varsayılan olarak bu mu açılsın?
}


