import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { FEATURE_ACCESS_KEY } from '../decorators/feature-access.decorator';
import { PricingUsageService } from '../services/pricing-usage.service';

@Injectable()
export class FeatureUsageInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private pricingUsageService: PricingUsageService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const featureKey = this.reflector.get<string>(
      FEATURE_ACCESS_KEY,
      context.getHandler(),
    );

    if (!featureKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    return next.handle().pipe(
      mergeMap(async (data) => {
        await this.pricingUsageService.incrementUsage(userId, featureKey);
        return data;
      }),
    );
  }
}
