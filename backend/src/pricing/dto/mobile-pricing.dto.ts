export class ActivePlanDto {
  id: string;
  name: string;
  code: string;
  priceAmount?: string;
  priceCurrency?: string;
  billingPeriod?: string;
  status?: string;
}

export class FeatureLimitDto {
  key: string;
  type: 'BOOLEAN' | 'INTEGER';
  description: string;
  limitValue: number;
  resetPeriod: 'DAILY' | 'MONTHLY' | 'NEVER';
}

export class UsageDto {
  key: string;
  usageCount: number;
  periodStart: Date;
  periodEnd: Date;
}

export class MobilePricingResponseDto {
  activePlan: ActivePlanDto | null;
  features: FeatureLimitDto[];
  usage: UsageDto[];
}
