import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  key: string;

  @IsString()
  description: string;

  @IsIn(['BOOLEAN', 'INTEGER'])
  type: 'BOOLEAN' | 'INTEGER';
}

export class UpdateFeatureDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['BOOLEAN', 'INTEGER'])
  type?: 'BOOLEAN' | 'INTEGER';
}
