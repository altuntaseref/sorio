import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeminiService } from './gemini.service';
import { PricingUsageService } from '../../pricing/services/pricing-usage.service';
import { Feature } from '../../pricing/entities/feature.entity';
import { PlanLimit } from '../../pricing/entities/plan-limit.entity';
import { getPeriodRange, ResetPeriod } from '../../pricing/utils/period.utils';

@Injectable()
export class AiSolveService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly pricingUsageService: PricingUsageService,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(PlanLimit)
    private planLimitRepository: Repository<PlanLimit>,
  ) {}

  async solveQuestion(userId: string, imageUrl: string): Promise<{
    solution: string;
    usageCount: number;
    remainingLimit: number;
  }> {
    // Check access
    await this.pricingUsageService.checkAccess(userId, 'ai_solve_limit');

    // Get current usage info
    const { plan } = await this.pricingUsageService.getActivePlan(userId);
    const feature = await this.featureRepository.findOne({
      where: { key: 'ai_solve_limit' },
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    const planLimit = await this.planLimitRepository.findOne({
      where: { planId: plan.id, featureId: feature.id },
    });

    if (!planLimit) {
      throw new Error('Plan limit not found');
    }

    const currentUsage = await this.pricingUsageService.getCurrentUsageCount(
      userId,
      feature.id,
      planLimit.resetPeriod as ResetPeriod,
    );

    // Call Gemini API
    const solution = await this.geminiService.solveQuestion(imageUrl);

    // Calculate remaining limit (interceptor will increment usage after this)
    const remainingLimit =
      planLimit.limitValue === -1
        ? -1
        : Math.max(0, planLimit.limitValue - currentUsage - 1);

    return {
      solution,
      usageCount: currentUsage + 1, // +1 because interceptor will increment
      remainingLimit,
    };
  }
}
