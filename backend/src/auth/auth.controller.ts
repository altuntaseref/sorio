import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
// Projende bu dosyaların yolları neredeyse oradan import etmelisin:
import { JwtAuthGuard } from './guards/jwt-auth.guard'; 
import { GetUser } from '../common/decorators/get-user.decorator'; 
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- YENİ EKLENEN LOGOUT ENDPOINT ---
  @UseGuards(JwtAuthGuard) // Sadece giriş yapmış kullanıcılar çıkış yapabilir
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetUser() user: User) {
    // Kullanıcının ID'sini servise gönderiyoruz
    return this.authService.logout(user.id);
  }
}