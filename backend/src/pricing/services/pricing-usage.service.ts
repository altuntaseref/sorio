import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Feature } from '../entities/feature.entity';
import { Plan } from '../entities/plan.entity';
import { PlanLimit } from '../entities/plan-limit.entity';
import { UserPlan } from '../entities/user-plan.entity';
import { UserUsage } from '../entities/user-usage.entity';
import { getPeriodRange, ResetPeriod } from '../utils/period.utils';

@Injectable()
export class PricingUsageService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(PlanLimit)
    private planLimitRepository: Repository<PlanLimit>,
    @InjectRepository(UserPlan)
    private userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserUsage)
    private userUsageRepository: Repository<UserUsage>,
    private dataSource: DataSource,
  ) {}

  async getActivePlan(userId: string): Promise<{ plan: Plan; status?: string }> {
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

  async checkAccess(userId: string, featureKey: string): Promise<boolean> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const feature = await this.featureRepository.findOne({ where: { key: featureKey } });
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    const { plan } = await this.getActivePlan(userId);
    const planLimit = await this.planLimitRepository.findOne({
      where: { planId: plan.id, featureId: feature.id },
    });

    if (!planLimit) {
      throw new ForbiddenException('Feature not included in plan');
    }

    if (feature.type === 'BOOLEAN') {
      if (!planLimit.isEnabled) {
        throw new ForbiddenException('Feature not available for this plan');
      }
      return true;
    }

    if (planLimit.limitValue === -1) {
      return true;
    }

    const usageCount = await this.getCurrentUsageCount(
      userId,
      feature.id,
      planLimit.resetPeriod as ResetPeriod,
    );

    if (usageCount >= planLimit.limitValue) {
      throw new ForbiddenException('Usage limit exceeded');
    }

    return true;
  }

  async incrementUsage(userId: string, featureKey: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const feature = await this.featureRepository.findOne({ where: { key: featureKey } });
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    if (feature.type === 'BOOLEAN') {
      return;
    }

    const { plan } = await this.getActivePlan(userId);
    const planLimit = await this.planLimitRepository.findOne({
      where: { planId: plan.id, featureId: feature.id },
    });

    if (!planLimit) {
      throw new ForbiddenException('Feature not included in plan');
    }

    if (planLimit.limitValue === -1) {
      return;
    }

    if (planLimit.limitValue <= 0) {
      throw new ForbiddenException('Usage limit exceeded');
    }

    const { periodStart, periodEnd } = getPeriodRange(planLimit.resetPeriod as ResetPeriod);

    const result = await this.dataSource.query(
      `
      INSERT INTO "user_usage" (
        "id",
        "user_id",
        "feature_id",
        "usage_count",
        "period_start",
        "period_end",
        "created_at",
        "updated_at"
      )
      VALUES (
        uuid_generate_v4(),
        $1,
        $2,
        1,
        $3,
        $4,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("user_id", "feature_id", "period_start")
      DO UPDATE SET
        "usage_count" = "user_usage"."usage_count" + 1,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "user_usage"."usage_count" < $5
      RETURNING "usage_count"
      `,
      [userId, feature.id, periodStart, periodEnd, planLimit.limitValue],
    );

    if (!result || result.length === 0) {
      throw new ForbiddenException('Usage limit exceeded');
    }
  }

  private async getCurrentUsageCount(
    userId: string,
    featureId: string,
    resetPeriod: ResetPeriod,
  ): Promise<number> {
    const { periodStart, periodEnd } = getPeriodRange(resetPeriod);

    const usage = await this.userUsageRepository.findOne({
      where: {
        userId,
        featureId,
        periodStart,
        periodEnd,
      },
    });

    return usage?.usageCount ?? 0;
  }
}
