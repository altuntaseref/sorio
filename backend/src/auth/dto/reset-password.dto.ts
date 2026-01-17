import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required.' })
  token!: string;

  @IsString()
  @MinLength(5, { message: 'New password must be at least 5 characters long.' })
  newPassword!: string;
}

