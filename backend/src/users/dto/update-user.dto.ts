import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string; // Deprecated: Artık avatarId kullanılacak

  @IsOptional()
  @IsUUID()
  avatarId?: string; // Avatar ID

  @IsOptional()
  @IsString()
  examTarget?: string;

  @IsOptional()
  @IsString()
  activeExamCode?: string; // Aktif sınav kodu (TYT, AYT_SAY, etc.)
}

