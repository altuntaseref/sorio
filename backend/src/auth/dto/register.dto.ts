import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email.' })
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  email!: string;

  @IsString()
  @MinLength(5, { message: 'Password must be at least 5 characters long.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName!: string;
}
