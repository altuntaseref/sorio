import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  backgroundImageUrl: string; // R2 URL

  @IsString()
  @IsOptional()
  @IsUrl()
  soundUrl?: string; // R2 URL (opsiyonel)

  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string; // R2 URL (opsiyonel)

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
