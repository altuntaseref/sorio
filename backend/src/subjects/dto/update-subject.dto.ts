import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
