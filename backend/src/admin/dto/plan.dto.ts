import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  revenueCatId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @IsOptional()
  @IsString()
  priceCurrency?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY', 'ONE_TIME'])
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  revenueCatId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @IsOptional()
  @IsString()
  priceCurrency?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY', 'ONE_TIME'])
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserPlanDto {
  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsString()
  planCode?: string;

  @IsOptional()
  @IsIn(['active', 'paused', 'canceled', 'expired', 'trialing'])
  status?: 'active' | 'paused' | 'canceled' | 'expired' | 'trialing';
}
