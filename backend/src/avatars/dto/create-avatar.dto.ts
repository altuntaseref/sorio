import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateAvatarDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string; // R2 URL - Image preview (zorunlu)

  @IsString()
  @IsOptional()
  @IsUrl()
  videoUrl?: string; // R2 URL - Video preview (opsiyonel)

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
