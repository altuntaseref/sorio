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
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionStatistic } from './statistics/entities/question-statistic.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([QuestionStatistic]),
    UsersModule,
    AuthModule,
    SubjectsModule,
    UploadModule,
    QuestionsModule,
  ],
  controllers: [AppController],
  providers: [LoggerService],
})
export class AppModule {}
