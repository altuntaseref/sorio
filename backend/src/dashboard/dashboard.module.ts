import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MotivationModule } from '../motivation/motivation.module';

@Module({
  imports: [MotivationModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

