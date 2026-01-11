import { IsOptional, IsIn } from 'class-validator';

export class GetAssetsDto {
  @IsOptional()
  @IsIn(['IMAGE', 'SOUND'])
  type?: 'IMAGE' | 'SOUND'; // Filtreleme için (opsiyonel)
}


