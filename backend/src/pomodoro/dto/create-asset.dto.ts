import {
  IsString,
  IsIn,
  IsOptional,
  IsUUID,
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

  @IsIn(['IMAGE', 'SOUND'])
  type: 'IMAGE' | 'SOUND';
}


