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

export class CreatePomodoroPresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string; // Örn: "Matematik Kampı", "Chill", "Hardcore"

  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  workDuration?: number; // Dakika (default: 25)

  @IsNumber()
  @Min(1)
  @Max(60)
  @IsOptional()
  breakDuration?: number; // Dakika (default: 5)

  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  longBreakDuration?: number; // Dakika (default: 15)

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  setsUntilLongBreak?: number; // Kaç sette bir uzun mola? (default: 4)

  @IsUUID()
  @IsOptional()
  backgroundImageId?: string; // PomodoroAsset ID (IMAGE tipinde)

  @IsUUID()
  @IsOptional()
  soundId?: string; // PomodoroAsset ID (SOUND tipinde)

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean; // Varsayılan olarak bu mu açılsın? (default: false)
}

