import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MotivationModule } from '../motivation/motivation.module';
import { UsersModule } from '../users/users.module';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [MotivationModule, UsersModule, ExamsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

