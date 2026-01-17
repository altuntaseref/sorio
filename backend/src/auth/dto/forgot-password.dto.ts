import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email.' })
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  email!: string;
}

