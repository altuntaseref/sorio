import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email.' })
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required.' })
  passwordConfirm!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName!: string;

  @IsOptional()
  @IsString()
  examTarget?: string;

  @IsOptional()
  @IsIn(['google', 'apple', 'email'])
  provider?: 'google' | 'apple' | 'email';

  @IsOptional()
  @IsString()
  providerId?: string;
}
