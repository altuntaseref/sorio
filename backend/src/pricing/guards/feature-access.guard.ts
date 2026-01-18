import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_ACCESS_KEY } from '../decorators/feature-access.decorator';
import { PricingUsageService } from '../services/pricing-usage.service';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private pricingUsageService: PricingUsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.get<string>(
      FEATURE_ACCESS_KEY,
      context.getHandler(),
    );

    if (!featureKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    return this.pricingUsageService.checkAccess(userId, featureKey);
  }
}
