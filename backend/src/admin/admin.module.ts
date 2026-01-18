import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { User } from '../users/entities/user.entity';
import { LoginLog } from '../auth/entities/login-log.entity';
import { Plan } from '../pricing/entities/plan.entity';
import { Feature } from '../pricing/entities/feature.entity';
import { PlanLimit } from '../pricing/entities/plan-limit.entity';
import { UserPlan } from '../pricing/entities/user-plan.entity';
import { UserUsage } from '../pricing/entities/user-usage.entity';
import { Question } from '../questions/entities/question.entity';
import { QuizSession } from '../quizzes/entities/quiz-session.entity';
import { MockExam } from '../mock-exams/entities/mock-exam.entity';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LoginLog,
      Plan,
      Feature,
      PlanLimit,
      UserPlan,
      UserUsage,
      Question,
      QuizSession,
      MockExam,
    ]),
    PricingModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminTokenGuard],
})
export class AdminModule {}
