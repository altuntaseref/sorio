import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AiSolveDto {
  @IsNotEmpty()
  @IsUrl()
  questionImageUrl: string;

  @IsNotEmpty()
  @IsString()
  questionImageKey: string;
}
