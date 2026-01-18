import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entities/feature.entity';
import { Plan } from './entities/plan.entity';
import { PlanLimit } from './entities/plan-limit.entity';
import { UserPlan } from './entities/user-plan.entity';
import { UserUsage } from './entities/user-usage.entity';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingUsageService } from './services/pricing-usage.service';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { FeatureUsageInterceptor } from './interceptors/feature-usage.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Feature, PlanLimit, UserPlan, UserUsage])],
  controllers: [PricingController],
  providers: [PricingService, PricingUsageService, FeatureAccessGuard, FeatureUsageInterceptor],
  exports: [PricingService, PricingUsageService, FeatureAccessGuard, FeatureUsageInterceptor],
})
export class PricingModule {}
