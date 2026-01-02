import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteImageDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
