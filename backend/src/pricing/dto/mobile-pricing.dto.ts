export class ActivePlanDto {
  id: string;
  name: string;
  code: string;
  priceAmount?: string;
  priceCurrency?: string;
  billingPeriod?: string;
  status?: string;
  startsAt?: Date;
  endsAt?: Date;
  renewsAt?: Date;
}

export class FeatureLimitDto {
  key: string;
  type: 'BOOLEAN' | 'INTEGER';
  description: string;
  limitValue: number; // For INTEGER: limit value, for BOOLEAN: 1=enabled, 0=disabled
  isEnabled?: boolean; // For BOOLEAN features: true/false (more explicit)
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
