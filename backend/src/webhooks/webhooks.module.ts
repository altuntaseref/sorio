import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WebhooksController } from './webhooks.controller';
import { RevenueCatWebhookService } from './services/revenue-cat-webhook.service';
import { RevenueCatApiService } from './services/revenue-cat-api.service';
import { User } from '../users/entities/user.entity';
import { Plan } from '../pricing/entities/plan.entity';
import { UserPlan } from '../pricing/entities/user-plan.entity';
import { UserUsage } from '../pricing/entities/user-usage.entity';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Plan, UserPlan, UserUsage]),
    HttpModule,
    AnalyticsModule,
  ],
  controllers: [WebhooksController],
  providers: [RevenueCatWebhookService, RevenueCatApiService],
  exports: [RevenueCatApiService],
})
export class WebhooksModule {}
