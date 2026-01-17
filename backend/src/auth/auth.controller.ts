import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return { message: 'User registered successfully.', data };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return { message: 'Login successful.', data };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetUser() user: User,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    const data = await this.authService.refresh(
      user,
      refreshTokenDto.refreshToken,
    );
    return { message: 'Tokens refreshed successfully.', data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: User) {
    await this.authService.logout(user.id);
    return { message: 'Logout successful.' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(forgotPasswordDto);
    return data;
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(resetPasswordDto);
    return data;
  }

  @SkipThrottle()
  @Get('redirect')
  redirect(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(400).send('Token is required');
    }

    const deepLink = `sorio://reset-password?token=${token}`;
    
    // HTML sayfası ile deep link'e yönlendir
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yönlendiriliyor...</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #0f2123 0%, #162a2c 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      border: 4px solid rgba(0, 229, 255, 0.3);
      border-top: 4px solid #00e5ff;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #00e5ff;
    }
    p {
      font-size: 0.9rem;
      color: #8dc8ce;
      margin-top: 0.5rem;
    }
    .fallback-link {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(0, 229, 255, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(0, 229, 255, 0.3);
    }
    .fallback-link a {
      color: #00e5ff;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Uygulama açılıyor...</h1>
    <p>Lütfen bekleyin</p>
    <div class="fallback-link">
      <p style="margin-bottom: 0.5rem; font-size: 0.85rem;">Uygulama açılmadıysa:</p>
      <a href="${deepLink}">Buraya tıklayın</a>
    </div>
  </div>
  <script>
    // Deep link'e yönlendir
    const deepLink = "${deepLink}";
    
    // Önce deep link'i dene
    window.location.href = deepLink;
    
    // Eğer 2 saniye içinde yönlendirme olmazsa, fallback link'i göster
    setTimeout(function() {
      // Tarayıcı hala açıksa, kullanıcıya manuel tıklama seçeneği sun
      console.log('Deep link açılamadı, fallback link gösteriliyor');
    }, 2000);
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}
