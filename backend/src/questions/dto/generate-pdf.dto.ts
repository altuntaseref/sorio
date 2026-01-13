import {
  IsArray,
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class GeneratePdfDto {
  @IsArray()
  @IsUUID('4', { each: true })
  questionIds: string[]; // PDF'e eklenecek soru ID'leri

  @IsString()
  @IsOptional()
  title?: string; // PDF başlığı (opsiyonel, default: "Sorular")

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  questionsPerPage?: number; // Her sayfada kaç soru (default: 1)

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(3)
  columns?: number; // Kaç sütun (default: 1)

  @IsBoolean()
  @IsOptional()
  preview?: boolean; // Önizleme modu (true ise base64 döner, false ise direkt indirir)
}
