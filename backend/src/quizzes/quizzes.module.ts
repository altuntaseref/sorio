import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizSession } from './entities/quiz-session.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { DailyStatistic } from '../statistics/entities/daily-statistic.entity';
import { QuestionStatistic } from '../statistics/entities/question-statistic.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizSession,
      Question,
      Subject,
      Topic,
      QuizAnswer,
      DailyStatistic,
      QuestionStatistic,
    ]),
    UsersModule,
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
