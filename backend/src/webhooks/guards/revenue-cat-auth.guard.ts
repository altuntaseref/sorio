import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RevenueCatAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const expectedToken = this.configService.get<string>(
      'REVENUE_CAT_WEBHOOK_SECRET',
    );

    if (!expectedToken) {
      throw new UnauthorizedException(
        'RevenueCat webhook secret not configured',
      );
    }

    // RevenueCat genellikle "Bearer <token>" formatında gönderir
    // veya direkt token gönderebilir
    const token =
      authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

    if (!token || token !== expectedToken) {
      throw new UnauthorizedException('Invalid RevenueCat webhook token');
    }

    return true;
  }
}
