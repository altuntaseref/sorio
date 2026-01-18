import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MotivationModule } from '../motivation/motivation.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MotivationModule, UsersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
