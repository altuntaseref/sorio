import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { PlanLimit } from './entities/plan-limit.entity';
import { UserPlan } from './entities/user-plan.entity';
import { UserUsage } from './entities/user-usage.entity';
import { MobilePricingResponseDto } from './dto/mobile-pricing.dto';
import { getPeriodRange, ResetPeriod } from './utils/period.utils';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(PlanLimit)
    private planLimitRepository: Repository<PlanLimit>,
    @InjectRepository(UserUsage)
    private userUsageRepository: Repository<UserUsage>,
    @InjectRepository(UserPlan)
    private userPlanRepository: Repository<UserPlan>,
  ) {}

  async getMobilePricing(userId: string): Promise<MobilePricingResponseDto> {
    const { plan, status } = await this.getActivePlan(userId);

    const planLimits = await this.planLimitRepository.find({
      where: { planId: plan.id },
      relations: ['feature'],
    });

    const featureIds = planLimits.map((limit) => limit.featureId);
    const now = new Date();

    const usageRows =
      featureIds.length > 0
        ? await this.userUsageRepository.find({
            where: {
              userId,
              featureId: In(featureIds),
              periodStart: LessThanOrEqual(now),
              periodEnd: MoreThanOrEqual(now),
            },
          })
        : [];

    const usageByFeatureId = new Map(
      usageRows.map((usage) => [usage.featureId, usage]),
    );

    return {
      activePlan: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        priceAmount: plan.priceAmount?.toString(),
        priceCurrency: plan.priceCurrency,
        billingPeriod: plan.billingPeriod,
        status,
      },
      features: planLimits.map((limit) => ({
        key: limit.feature.key,
        type: limit.feature.type,
        description: limit.feature.description,
        limitValue: limit.limitValue,
        resetPeriod: limit.resetPeriod,
      })),
      usage: planLimits.map((limit) => {
        const usage = usageByFeatureId.get(limit.featureId);
        const { periodStart, periodEnd } = getPeriodRange(
          limit.resetPeriod as ResetPeriod,
        );
        return {
          key: limit.feature.key,
          usageCount: usage?.usageCount ?? 0,
          periodStart,
          periodEnd,
        };
      }),
    };
  }

  private async getActivePlan(userId: string): Promise<{ plan: Plan; status?: string }> {
    const activeUserPlan = await this.userPlanRepository.findOne({
      where: { userId, status: In(['active', 'trialing']) },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (activeUserPlan?.plan) {
      return { plan: activeUserPlan.plan, status: activeUserPlan.status };
    }

    const fallbackPlan = await this.planRepository.findOne({
      where: { code: 'free_tier' },
    });

    if (!fallbackPlan) {
      throw new NotFoundException('Active plan not found');
    }

    return { plan: fallbackPlan };
  }
}
