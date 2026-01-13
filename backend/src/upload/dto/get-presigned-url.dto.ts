import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsIn(['question', 'solution', 'asset'])
  fileType: 'question' | 'solution' | 'asset';

  @IsString()
  @IsOptional()
  contentType?: string;
}
