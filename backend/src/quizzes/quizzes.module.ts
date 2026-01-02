import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { QuizSession } from './entities/quiz-session.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSession, QuizAnswer, Question, Subject, Topic]),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
