import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsIn(['question', 'solution'])
  fileType: 'question' | 'solution';

  @IsString()
  @IsOptional()
  contentType?: string;
}
