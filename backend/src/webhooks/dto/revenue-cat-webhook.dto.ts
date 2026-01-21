export enum RevenueCatEventType {
  INITIAL_PURCHASE = 'INITIAL_PURCHASE',
  RENEWAL = 'RENEWAL',
  CANCELLATION = 'CANCELLATION',
  EXPIRATION = 'EXPIRATION',
  BILLING_ISSUE = 'BILLING_ISSUE',
  PRODUCT_CHANGE = 'PRODUCT_CHANGE',
  SUBSCRIPTION_PAUSED = 'SUBSCRIPTION_PAUSED',
  SUBSCRIPTION_EXTENDED = 'SUBSCRIPTION_EXTENDED',
}

export class RevenueCatEventDto {
  type: RevenueCatEventType;
  id: string;
  app_user_id: string; // User UUID
  product_id: string; // pro_monthly, pro_yearly, etc.
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  environment: 'PRODUCTION' | 'SANDBOX';
  currency?: string;
  price?: number;
  period_type?: 'NORMAL' | 'TRIAL' | 'INTRO';
  store?: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
}

export class RevenueCatWebhookDto {
  api_version: string;
  event: RevenueCatEventDto;
}
