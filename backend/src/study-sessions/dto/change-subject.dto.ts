import { IsUUID, IsOptional } from 'class-validator';

export class ChangeSubjectDto {
  @IsOptional()
  @IsUUID()
  newSubjectId?: string; // Yeni ders ID (null ise ders kaldırılır)
}
