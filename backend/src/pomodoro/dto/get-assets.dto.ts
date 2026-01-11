import { IsOptional, IsIn } from 'class-validator';

export class GetAssetsDto {
  @IsOptional()
  @IsIn(['IMAGE', 'SOUND', 'VIDEO'])
  type?: 'IMAGE' | 'SOUND' | 'VIDEO'; // Filtreleme için (opsiyonel)
}


