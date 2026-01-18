import { SetMetadata } from '@nestjs/common';

export const FEATURE_ACCESS_KEY = 'feature_access';

export const FeatureAccess = (featureKey: string) =>
  SetMetadata(FEATURE_ACCESS_KEY, featureKey);
