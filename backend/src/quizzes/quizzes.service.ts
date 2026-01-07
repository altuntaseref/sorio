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

    // SRS (Spaced Repetition System) ile soru seçimi
    const questions = await this.selectQuestionsWithSRS(
      userId,
      mode,
      subjectIds,
      topicIds,
    );

    if (questions.length === 0) {
      throw new NotFoundException('No questions found matching your criteria');
    }

    const quizSession = this.quizSessionRepository.create({
      userId,
      mode,
      totalQuestions: questions.length,
      correctCount: 0,
      incorrectCount: 0,
    });

    await this.quizSessionRepository.save(quizSession);

    return {
      quizId: quizSession.id,
      totalQuestions: questions.length,
      questions: questions.map((q) => ({
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

    // SRS: QuestionStatistic güncelle (mastery_level ve next_review_at)
    await this.updateQuestionStatisticSRS(userId, questionId, isCorrect);

    // SRS bilgisi al
    const questionStat = await this.questionStatisticRepository.findOne({
      where: { userId, questionId },
    });

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      stats: {
        totalAnswered: updatedQuizSession.correctCount + updatedQuizSession.incorrectCount,
        correctCount: updatedQuizSession.correctCount,
        incorrectCount: updatedQuizSession.incorrectCount,
      },
      mastery: {
        level: questionStat?.masteryLevel ?? 0,
        nextReviewAt: questionStat?.nextReviewAt?.toISOString() ?? null,
      },
    };
  }

  /**
   * SRS (Spaced Repetition System) ile soru seçimi
   * Öncelik sırası:
   * 1. Acil Tekrar: next_review_at <= NOW() veya NULL
   * 2. Kırmızı Bölge: mastery_level < 2
   * 3. Karıştırma: Rastgele (mastery_level yüksek olanlar)
   */
  private async selectQuestionsWithSRS(
    userId: string,
    mode: 'learning' | 'wrong-answers',
    subjectIds?: string[],
    topicIds?: string[],
  ): Promise<Question[]> {
    const now = new Date();
    const selectedQuestions: Question[] = [];
    const usedQuestionIds = new Set<string>();

    // ÖNCE 1: Acil Tekrar (next_review_at <= NOW() veya NULL)
    let urgentQuery = `
      SELECT 
        q.id,
        q.name,
        q.user_id as "userId",
        q.subject_id as "subjectId",
        q.topic_id as "topicId",
        q.question_image_url as "questionImageUrl",
        q."correctAnswer" as "correctAnswer",
        q.created_at as "createdAt",
        q.updated_at as "updatedAt",
        qs.next_review_at
      FROM questions q
      LEFT JOIN question_statistics qs ON q.id = qs.question_id AND qs.user_id = $1::uuid
      WHERE q.user_id = $1::uuid
      AND (
        qs.next_review_at IS NULL 
        OR qs.next_review_at <= $2
      )
    `;
    
    const urgentParams: any[] = [userId, now];
    
    if (subjectIds?.length) {
      urgentQuery += ` AND q.subject_id = ANY($${urgentParams.length + 1}::uuid[])`;
      urgentParams.push(subjectIds);
    }
    
    if (topicIds?.length) {
      urgentQuery += ` AND q.topic_id = ANY($${urgentParams.length + 1}::uuid[])`;
      urgentParams.push(topicIds);
    }
    
    urgentQuery += `
      ORDER BY 
        CASE 
          WHEN qs.next_review_at IS NULL THEN 0
          ELSE 1
        END,
        qs.next_review_at ASC
      LIMIT 50
    `;
    
    const urgentQuestions = await this.dataSource.query(urgentQuery, urgentParams);

    for (const q of urgentQuestions) {
      if (!usedQuestionIds.has(q.id)) {
        // Raw SQL sonucunu Question entity formatına çevir
        selectedQuestions.push(this.mapRawToQuestion(q));
        usedQuestionIds.add(q.id);
      }
    }

    // Eğer yeterli soru yoksa, ÖNCE 2: Kırmızı Bölge (mastery_level < 2)
    if (selectedQuestions.length < 20) {
      let weakQuery = `
        SELECT 
          q.id,
          q.name,
          q.user_id as "userId",
          q.subject_id as "subjectId",
          q.topic_id as "topicId",
          q.question_image_url as "questionImageUrl",
          q."correctAnswer" as "correctAnswer",
          q.created_at as "createdAt",
          q.updated_at as "updatedAt",
          qs.mastery_level,
          qs.incorrect_count
        FROM questions q
        LEFT JOIN question_statistics qs ON q.id = qs.question_id AND qs.user_id = $1::uuid
        WHERE q.user_id = $1::uuid
        AND (
          qs.mastery_level IS NULL 
          OR qs.mastery_level < 2
        )
      `;
      
      const weakParams: any[] = [userId];
      let paramIndex = 2;
      
      if (subjectIds?.length) {
        weakQuery += ` AND q.subject_id = ANY($${paramIndex}::uuid[])`;
        weakParams.push(subjectIds);
        paramIndex++;
      }
      
      if (topicIds?.length) {
        weakQuery += ` AND q.topic_id = ANY($${paramIndex}::uuid[])`;
        weakParams.push(topicIds);
        paramIndex++;
      }
      
      if (usedQuestionIds.size > 0) {
        weakQuery += ` AND q.id != ALL($${paramIndex}::uuid[])`;
        weakParams.push(Array.from(usedQuestionIds));
        paramIndex++;
      }
      
      weakQuery += `
        ORDER BY 
          COALESCE(qs.mastery_level, 0) ASC,
          qs.incorrect_count DESC
        LIMIT ${50 - selectedQuestions.length}
      `;
      
      const weakQuestions = await this.dataSource.query(weakQuery, weakParams);

      for (const q of weakQuestions) {
        if (!usedQuestionIds.has(q.id)) {
          selectedQuestions.push(this.mapRawToQuestion(q));
          usedQuestionIds.add(q.id);
        }
      }
    }

    // Eğer hala yeterli soru yoksa, ÖNCE 3: Karıştırma (rastgele)
    if (selectedQuestions.length < 20) {
      let randomQuery = `
        SELECT 
          q.id,
          q.name,
          q.user_id as "userId",
          q.subject_id as "subjectId",
          q.topic_id as "topicId",
          q.question_image_url as "questionImageUrl",
          q."correctAnswer" as "correctAnswer",
          q.created_at as "createdAt",
          q.updated_at as "updatedAt"
        FROM questions q
        WHERE q.user_id = $1::uuid
      `;
      
      const randomParams: any[] = [userId];
      let paramIndex = 2;
      
      if (subjectIds?.length) {
        randomQuery += ` AND q.subject_id = ANY($${paramIndex}::uuid[])`;
        randomParams.push(subjectIds);
        paramIndex++;
      }
      
      if (topicIds?.length) {
        randomQuery += ` AND q.topic_id = ANY($${paramIndex}::uuid[])`;
        randomParams.push(topicIds);
        paramIndex++;
      }
      
      if (usedQuestionIds.size > 0) {
        randomQuery += ` AND q.id != ALL($${paramIndex}::uuid[])`;
        randomParams.push(Array.from(usedQuestionIds));
        paramIndex++;
      }
      
      randomQuery += `
        ORDER BY RANDOM()
        LIMIT ${50 - selectedQuestions.length}
      `;
      
      const randomQuestions = await this.dataSource.query(randomQuery, randomParams);

      for (const q of randomQuestions) {
        if (!usedQuestionIds.has(q.id)) {
          selectedQuestions.push(this.mapRawToQuestion(q));
          usedQuestionIds.add(q.id);
        }
      }
    }

    // "wrong-answers" modu için filtreleme
    if (mode === 'wrong-answers') {
      const wrongAnswerQuestionIds = await this.dataSource.query(
        `
        SELECT DISTINCT question_id
        FROM question_statistics
        WHERE user_id = $1::uuid
        AND incorrect_count > 0
      `,
        [userId],
      );

      const wrongAnswerIds = new Set(
        wrongAnswerQuestionIds.map((r) => r.question_id),
      );

      return selectedQuestions.filter((q) => wrongAnswerIds.has(q.id));
    }

    // Karıştır ve döndür
    return selectedQuestions.sort(() => Math.random() - 0.5);
  }

  /**
   * Raw SQL sonucunu Question entity formatına çevir
   */
  private mapRawToQuestion(raw: any): Question {
    const question = new Question();
    question.id = raw.id;
    question.name = raw.name;
    question.userId = raw.userId;
    question.subjectId = raw.subjectId;
    question.topicId = raw.topicId;
    question.questionImageUrl = raw.questionImageUrl;
    question.correctAnswer = raw.correctAnswer;
    question.createdAt = raw.createdAt;
    question.updatedAt = raw.updatedAt;
    // Quiz başlatırken solution bilgileri gerekmez, sadece soru gösterilir
    return question;
  }

  /**
   * Mastery level'a göre next_review_at hesapla
   */
  private calculateNextReviewDate(masteryLevel: number): Date {
    const now = new Date();
    const nextReview = new Date(now);

    switch (masteryLevel) {
      case 0: // Yeni soru
        nextReview.setHours(now.getHours() + 1); // 1 saat sonra
        break;
      case 1:
        nextReview.setDate(now.getDate() + 1); // 1 gün sonra
        break;
      case 2:
        nextReview.setDate(now.getDate() + 3); // 3 gün sonra
        break;
      case 3:
        nextReview.setDate(now.getDate() + 7); // 1 hafta sonra
        break;
      case 4:
        nextReview.setDate(now.getDate() + 30); // 1 ay sonra
        break;
      case 5: // Ezberlendi
        nextReview.setDate(now.getDate() + 90); // 3 ay sonra
        break;
      default:
        nextReview.setDate(now.getDate() + 1);
    }

    return nextReview;
  }

  /**
   * SRS: QuestionStatistic güncelle (submitAnswer için)
   */
  private async updateQuestionStatisticSRS(
    userId: string,
    questionId: string,
    isCorrect: boolean,
  ): Promise<void> {
    let questionStat = await this.questionStatisticRepository.findOne({
      where: { userId, questionId },
    });

    if (!questionStat) {
      questionStat = this.questionStatisticRepository.create({
        userId,
        questionId,
        totalAttempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        masteryLevel: 0,
      });
    }

    questionStat.totalAttempts = (questionStat.totalAttempts ?? 0) + 1;
    questionStat.lastAttemptedAt = new Date();

    if (isCorrect) {
      questionStat.correctCount = (questionStat.correctCount ?? 0) + 1;
      // Doğru cevap: mastery_level artır (max 5)
      questionStat.masteryLevel = Math.min(
        (questionStat.masteryLevel ?? 0) + 1,
        5,
      );
    } else {
      questionStat.incorrectCount = (questionStat.incorrectCount ?? 0) + 1;
      // Yanlış cevap: mastery_level sıfırla veya 1 düşür
      questionStat.masteryLevel = Math.max(
        (questionStat.masteryLevel ?? 0) - 1,
        0,
      );
    }

    // next_review_at hesapla
    questionStat.nextReviewAt = this.calculateNextReviewDate(
      questionStat.masteryLevel ?? 0,
    );

    await this.questionStatisticRepository.save(questionStat);
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
            masteryLevel: 0,
          });
        }

        questionStat.totalAttempts = (questionStat.totalAttempts ?? 0) + 1;
        if (answer.isCorrect) {
          questionStat.correctCount = (questionStat.correctCount ?? 0) + 1;
        } else {
          questionStat.incorrectCount = (questionStat.incorrectCount ?? 0) + 1;
        }
        questionStat.lastAttemptedAt = new Date();

        // SRS: Mastery level ve next_review_at güncelle
        if (answer.isCorrect) {
          // Doğru cevap: mastery_level artır (max 5)
          questionStat.masteryLevel = Math.min(
            (questionStat.masteryLevel ?? 0) + 1,
            5,
          );
        } else {
          // Yanlış cevap: mastery_level sıfırla veya 1 düşür
          questionStat.masteryLevel = Math.max(
            (questionStat.masteryLevel ?? 0) - 1,
            0,
          );
        }

        // next_review_at hesapla
        questionStat.nextReviewAt = this.calculateNextReviewDate(
          questionStat.masteryLevel ?? 0,
        );

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
