import { IsBoolean, IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdatePlanLimitDto {
  @IsUUID()
  planId: string;

  @IsUUID()
  featureId: string;

  @IsOptional()
  @IsInt()
  @Min(-1)
  limitValue?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsIn(['DAILY', 'MONTHLY', 'NEVER'])
  resetPeriod: 'DAILY' | 'MONTHLY' | 'NEVER';
}
