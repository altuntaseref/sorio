import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DetailedAnalysisDataService } from './services/detailed-analysis-data.service';
import { DetailedAnalysisStorageService } from './services/detailed-analysis-storage.service';
import { WeeklyAnalysisSchedulerService } from './services/weekly-analysis-scheduler.service';
import { MotivationModule } from '../motivation/motivation.module';
import { UsersModule } from '../users/users.module';
import { PricingModule } from '../pricing/pricing.module';
import { UploadModule } from '../upload/upload.module';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { QuizSession } from '../quizzes/entities/quiz-session.entity';
import { QuizAnswer } from '../quizzes/entities/quiz-answer.entity';
import { QuestionStatistic } from '../statistics/entities/question-statistic.entity';
import { DailyStatistic } from '../statistics/entities/daily-statistic.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { UserAnalysis } from './entities/user-analysis.entity';
import { UserPlan } from '../pricing/entities/user-plan.entity';
import { Plan } from '../pricing/entities/plan.entity';
import { MockExam } from '../mock-exams/entities/mock-exam.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudySession,
      QuizSession,
      QuizAnswer,
      QuestionStatistic,
      DailyStatistic,
      Question,
      Subject,
      Topic,
      UserAnalysis,
      UserPlan,
      Plan,
      MockExam,
      User,
    ]),
    MotivationModule,
    UsersModule,
    PricingModule,
    UploadModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    DetailedAnalysisDataService,
    DetailedAnalysisStorageService,
    WeeklyAnalysisSchedulerService,
  ],
  exports: [WeeklyAnalysisSchedulerService],
})
export class AnalyticsModule {}
