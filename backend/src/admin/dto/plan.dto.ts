import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  revenueCatId?: string;

  @IsOptional()
  @Type(() => Number)
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
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceYearly?: number;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureTexts?: string[];
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
  @Type(() => Number)
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
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceYearly?: number;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureTexts?: string[];

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

  @IsOptional()
  @Type(() => Date)
  startsAt?: Date; // Başlama tarihi (verilmezse şu anki tarih kullanılır)
}
