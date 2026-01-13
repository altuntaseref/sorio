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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [LoggerService],
})
export class AppModule {}
