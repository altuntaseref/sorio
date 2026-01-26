import { IsNumber, Min } from 'class-validator';

export class UpdateTimerDto {
  @IsNumber()
  @Min(0)
  elapsedSeconds: number; // Geçen süre (saniye cinsinden)
}
