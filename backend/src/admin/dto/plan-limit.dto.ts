import { IsIn, IsInt, IsUUID, Min } from 'class-validator';

export class UpdatePlanLimitDto {
  @IsUUID()
  planId: string;

  @IsUUID()
  featureId: string;

  @IsInt()
  @Min(-1)
  limitValue: number;

  @IsIn(['DAILY', 'MONTHLY', 'NEVER'])
  resetPeriod: 'DAILY' | 'MONTHLY' | 'NEVER';
}
