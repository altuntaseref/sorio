import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
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

  @IsString()
  @IsOptional()
  backgroundImageId?: string; // Seçtiği arka plan (Local asset ID veya URL)

  @IsString()
  @IsOptional()
  soundId?: string; // Seçtiği ses (Rain, Fire, Silence)

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean; // Varsayılan olarak bu mu açılsın? (default: false)
}

