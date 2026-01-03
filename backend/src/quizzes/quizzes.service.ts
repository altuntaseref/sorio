import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { StartQuizDto } from './dto/start-quiz.dto';
import { QuizSession } from './entities/quiz-session.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { DailyStatistic } from '../statistics/entities/daily-statistic.entity';
import { QuestionStatistic } from '../statistics/entities/question-statistic.entity';

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
    @InjectRepository(QuizAnswer)
    private quizAnswerRepository: Repository<QuizAnswer>,
    @InjectRepository(DailyStatistic)
    private dailyStatisticRepository: Repository<DailyStatistic>,
    @InjectRepository(QuestionStatistic)
    private questionStatisticRepository: Repository<QuestionStatistic>,
    private dataSource: DataSource,
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
      correctCount: 0,
      incorrectCount: 0,
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

  async submitAnswer(quizId: string, userId: string, submitAnswerDto: SubmitAnswerDto) {
    const { questionId, userAnswer } = submitAnswerDto;

    const quizSession = await this.quizSessionRepository.findOne({ where: { id: quizId, userId }});

    if (!quizSession) {
      throw new NotFoundException('Quiz session not found');
    }

    if (quizSession.completedAt) {
      throw new BadRequestException('Quiz session is already completed');
    }

    const question = await this.questionRepository.findOne({ where: { id: questionId } });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = question.correctAnswer === userAnswer;

    const quizAnswer = this.quizAnswerRepository.create({
      quizSessionId: quizId,
      questionId,
      userAnswer,
      isCorrect,
    });

    await this.quizAnswerRepository.save(quizAnswer);

    if (isCorrect) {
      quizSession.correctCount = (quizSession.correctCount ?? 0) + 1;
    } else {
      quizSession.incorrectCount = (quizSession.incorrectCount ?? 0) + 1;
    }

    const updatedQuizSession = await this.quizSessionRepository.save(quizSession);

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      stats: {
        totalAnswered: updatedQuizSession.correctCount + updatedQuizSession.incorrectCount,
        correctCount: updatedQuizSession.correctCount,
        incorrectCount: updatedQuizSession.incorrectCount,
      }
    };
  }

  async completeQuiz(quizId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quizSession = await queryRunner.manager.findOne(QuizSession, {
        where: { id: quizId, userId },
        relations: ['answers'],
      });

      if (!quizSession) {
        throw new NotFoundException('Quiz session not found');
      }

      if (quizSession.completedAt) {
        throw new BadRequestException('Quiz session is already completed');
      }

      quizSession.completedAt = new Date();
      await queryRunner.manager.save(quizSession);

      const today = new Date().toISOString().split('T')[0];
      let dailyStat = await queryRunner.manager.findOne(DailyStatistic, {
        where: { userId, date: today },
      });

      if (!dailyStat) {
        dailyStat = this.dailyStatisticRepository.create({
          userId,
          date: today,
          questionsSolved: 0,
          correctCount: 0,
          incorrectCount: 0,
        });
      }

      dailyStat.questionsSolved = (dailyStat.questionsSolved ?? 0) + quizSession.totalQuestions;
      dailyStat.correctCount = (dailyStat.correctCount ?? 0) + quizSession.correctCount;
      dailyStat.incorrectCount = (dailyStat.incorrectCount ?? 0) + quizSession.incorrectCount;
      await queryRunner.manager.save(dailyStat);

      for (const answer of quizSession.answers) {
        let questionStat = await queryRunner.manager.findOne(
          QuestionStatistic,
          {
            where: { userId, questionId: answer.questionId },
          },
        );

        if (!questionStat) {
          questionStat = this.questionStatisticRepository.create({
            userId,
            questionId: answer.questionId,
            totalAttempts: 0,
            correctCount: 0,
            incorrectCount: 0,
          });
        }

        questionStat.totalAttempts = (questionStat.totalAttempts ?? 0) + 1;
        if (answer.isCorrect) {
          questionStat.correctCount = (questionStat.correctCount ?? 0) + 1;
        } else {
          questionStat.incorrectCount = (questionStat.incorrectCount ?? 0) + 1;
        }
        questionStat.lastAttemptedAt = new Date();
        await queryRunner.manager.save(questionStat);
      }

      await queryRunner.commitTransaction();

      const accuracy =
        quizSession.totalQuestions > 0
          ? (quizSession.correctCount / quizSession.totalQuestions) * 100
          : 0;

      return {
        quizId: quizSession.id,
        totalQuestions: quizSession.totalQuestions,
        correctCount: quizSession.correctCount,
        incorrectCount: quizSession.incorrectCount,
        accuracy: parseFloat(accuracy.toFixed(2)),
        completedAt: quizSession.completedAt.toISOString(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getQuiz(quizId: string, userId: string) {
    const quizSession = await this.quizSessionRepository.findOne({
      where: { id: quizId },
      relations: ['answers', 'answers.question'],
    });

    if (!quizSession) {
      throw new NotFoundException('Quiz session not found');
    }

    if (quizSession.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this quiz');
    }
    
    // Sanitize the questions to only return the required fields
    const sanitizedAnswers = quizSession.answers.map(answer => ({
      id: answer.id,
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      isCorrect: answer.isCorrect,
      answeredAt: answer.answeredAt,
      question: {
        id: answer.question.id,
        questionImageUrl: answer.question.questionImageUrl,
        correctAnswer: answer.question.correctAnswer,
      },
    }));

    return {
        quiz: {
            ...quizSession,
            answers: sanitizedAnswers
        }
    };
  }
}
