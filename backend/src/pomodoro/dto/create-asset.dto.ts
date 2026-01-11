import {
  IsString,
  IsIn,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string; // "Yağmurlu Gece" veya kullanıcının verdiği isim

  @IsString()
  url: string; // R2'den gelen publicUrl

  @IsString()
  @IsOptional()
  r2Key?: string; // R2'deki dosya key'i (silme için)

  @IsIn(['IMAGE', 'SOUND', 'VIDEO'])
  type: 'IMAGE' | 'SOUND' | 'VIDEO';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10 * 1024 * 1024) // Max 10MB
  fileSize?: number; // Dosya boyutu (byte cinsinden)

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(30) // Max 30 saniye
  durationSeconds?: number; // Video/GIF süresi (saniye cinsinden)
}


