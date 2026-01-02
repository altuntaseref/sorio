import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // ConfigService'den refresh token secret'ını alıyoruz.
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');

    // Eğer secret .env dosyasında tanımlı değilse, bu kritik bir konfigürasyon hatasıdır.
    // Uygulamanın güvenli olmayan bir durumda çalışmasını engellemek için
    // başlangıçta bir hata fırlatıyoruz.
    if (!refreshSecret) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET environment variable is not defined.',
      );
    }

    super({
      // TypeScript hatasını gidermek için secret'ın varlığını yukarıda kontrol ettik.
      // Artık 'super' fonksiyonuna güvenle 'refreshSecret' değişkenini verebiliriz.
      secretOrKey: refreshSecret,

      // Token'ın request body'sindeki 'refreshToken' alanından okunacağını belirtir.
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      
      // Süresi dolmuş token'ların otomatik olarak reddedilmesini sağlar.
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
