import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerService } from './common/logger/logger.service';
import { SubjectsModule } from './subjects/subjects.module';
import { UploadModule } from './upload/upload.module';
import { QuestionsModule } from './questions/questions.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MotivationModule } from './motivation/motivation.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PresetsModule } from './presets/presets.module';
import { AssetsModule } from './assets/assets.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { ExamsModule } from './exams/exams.module';
import { MockExamsModule } from './mock-exams/mock-exams.module';
import { PricingModule } from './pricing/pricing.module';
import { AdminModule } from './admin/admin.module';
import { LegalModule } from './legal/legal.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    SubjectsModule,
    UploadModule,
    QuestionsModule,
    QuizzesModule,
    StatisticsModule,
    AnalyticsModule,
    SchedulerModule,
    MotivationModule,
    DashboardModule,
    PresetsModule,
    AssetsModule,
    StudySessionsModule,
    ExamsModule,
    MockExamsModule,
    PricingModule,
    AdminModule,
    LegalModule,
  ],
  controllers: [AppController],
  providers: [
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
