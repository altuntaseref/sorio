import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StartQuizDto } from './dto/start-quiz.dto';
import { QuizSession } from './entities/quiz-session.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(QuizSession)
    private quizSessionRepository: Repository<QuizSession>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async startQuiz(userId: string, startQuizDto: StartQuizDto) {
    const { mode, subjectIds, topicIds } = startQuizDto;

    if (!subjectIds?.length && !topicIds?.length) {
      throw new BadRequestException(
        'At least one subjectId or topicId must be provided',
      );
    }

    if (subjectIds?.length) {
      const subjects = await this.subjectRepository.find({
        where: { id: In(subjectIds) },
      });

      if (subjects.length !== subjectIds.length) {
        throw new BadRequestException('One or more subjectIds are invalid');
      }

      for (const subject of subjects) {
        if (!subject.isSystem && subject.userId !== userId) {
          throw new ForbiddenException(
            `You do not have access to subject with ID ${subject.id}`,
          );
        }
      }
    }

    if (topicIds?.length) {
      const topics = await this.topicRepository.find({
        where: { id: In(topicIds) },
        relations: ['subject'],
      });

      if (topics.length !== topicIds.length) {
        throw new BadRequestException('One or more topicIds are invalid');
      }

      for (const topic of topics) {
        if (!topic.subject.isSystem && topic.subject.userId !== userId) {
          throw new ForbiddenException(
            `You do not have access to topic with ID ${topic.id}`,
          );
        }
      }
    }

    const queryBuilder = this.questionRepository.createQueryBuilder('question');

    if (mode === 'wrong-answers') {
      queryBuilder.innerJoin(
        'question.stats',
        'stat',
        'stat.userId = :userId AND stat.incorrectCount > 0',
        { userId },
      );
    }

    const whereClauses: string[] = [];
    const params: { [key: string]: any } = {};

    if (subjectIds?.length) {
      whereClauses.push('question.subjectId IN (:...subjectIds)');
      params.subjectIds = subjectIds;
    }

    if (topicIds?.length) {
      whereClauses.push('question.topicId IN (:...topicIds)');
      params.topicIds = topicIds;
    }

    if (whereClauses.length > 0) {
      queryBuilder.andWhere(`(${whereClauses.join(' OR ')})`, params);
    }

    const questions = await queryBuilder.getMany();

    if (questions.length === 0) {
      throw new NotFoundException('No questions found matching your criteria');
    }

    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    const quizSession = this.quizSessionRepository.create({
      userId,
      mode,
      totalQuestions: shuffledQuestions.length,
    });

    await this.quizSessionRepository.save(quizSession);

    return {
      quizId: quizSession.id,
      totalQuestions: shuffledQuestions.length,
      questions: shuffledQuestions.map((q) => ({
        id: q.id,
        questionImageUrl: q.questionImageUrl,
      })),
    };
  }
}
