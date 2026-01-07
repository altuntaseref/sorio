import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QuoteCategory } from '../entities/motivation-quote.entity';

export class CreateMotivationQuoteDto {
  @IsNotEmpty({ message: 'İçerik boş olamaz' })
  @IsString({ message: 'İçerik metin olmalıdır' })
  content: string;

  @IsNotEmpty({ message: 'Kategori boş olamaz' })
  @IsEnum(QuoteCategory, { message: 'Geçersiz kategori' })
  category: QuoteCategory;

  @IsOptional()
  @IsBoolean({ message: 'isActive boolean olmalıdır' })
  isActive?: boolean;
}

