import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];
    const expected = this.configService.get<string>('ADMIN_API_TOKEN');

    if (!expected) {
      throw new UnauthorizedException('Admin token not configured');
    }

    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
