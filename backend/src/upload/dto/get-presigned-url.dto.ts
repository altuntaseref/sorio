import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsIn(['question', 'solution', 'pomodoro-asset'])
  fileType: 'question' | 'solution' | 'pomodoro-asset';

  @IsString()
  @IsOptional()
  contentType?: string;
}
