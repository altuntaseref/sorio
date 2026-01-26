import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  backgroundImageUrl?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  soundUrl?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
