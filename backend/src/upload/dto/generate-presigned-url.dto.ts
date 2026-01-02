import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class GeneratePresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsIn(['question', 'solution'])
  fileType: 'question' | 'solution';
}
