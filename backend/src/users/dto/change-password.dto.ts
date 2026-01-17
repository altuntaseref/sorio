import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required.' })
  currentPassword!: string;

  @IsString()
  @MinLength(5, { message: 'New password must be at least 5 characters long.' })
  newPassword!: string;
}

