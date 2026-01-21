import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { StudySession } from '../../study-sessions/entities/study-session.entity';
import { QuizSession } from '../../quizzes/entities/quiz-session.entity';
import { QuizAnswer } from '../../quizzes/entities/quiz-answer.entity';
import { QuestionStatistic } from '../../statistics/entities/question-statistic.entity';
import { DailyStatistic } from '../../statistics/entities/daily-statistic.entity';
import { Question } from '../../questions/entities/question.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { MockExam } from '../../mock-exams/entities/mock-exam.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class DetailedAnalysisDataService {
  constructor(
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(QuizSession)
    private quizSessionRepository: Repository<QuizSession>,
    @InjectRepository(QuizAnswer)
    private quizAnswerRepository: Repository<QuizAnswer>,
    @InjectRepository(QuestionStatistic)
    private questionStatisticRepository: Repository<QuestionStatistic>,
    @InjectRepository(DailyStatistic)
    private dailyStatisticRepository: Repository<DailyStatistic>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(MockExam)
    private mockExamRepository: Repository<MockExam>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async collectUserData(userId: string, weekStart?: Date, weekEnd?: Date) {
    // Kullanıcı bilgisini al
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName'],
    });

    // Haftalık filtreleme için tarih aralığı
    const dateFilter = weekStart && weekEnd 
      ? { start: weekStart, end: weekEnd }
      : null;

    // Tüm verileri paralel olarak topla
    const [
      studySessions,
      quizSessions,
      questionStats,
      dailyStats,
      subjectPerformance,
      topicPerformance,
      examCodePerformance,
      recentQuizAnswers,
      masteryDistribution,
      timeDistribution,
      mockExams,
    ] = await Promise.all([
      this.getStudySessions(userId, dateFilter),
      this.getQuizSessions(userId, dateFilter),
      this.getQuestionStatistics(userId, dateFilter),
      this.getDailyStatistics(userId, dateFilter),
      this.getSubjectPerformance(userId, dateFilter),
      this.getTopicPerformance(userId, dateFilter),
      this.getExamCodePerformance(userId, dateFilter),
      this.getRecentQuizAnswers(userId, dateFilter),
      this.getMasteryDistribution(userId),
      this.getTimeDistribution(userId, dateFilter),
      this.getMockExams(userId, dateFilter),
    ]);

    return {
      user: {
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
      },
      studySessions,
      quizSessions,
      questionStats,
      dailyStats,
      subjectPerformance,
      topicPerformance,
      examCodePerformance,
      recentQuizAnswers,
      masteryDistribution,
      timeDistribution,
      mockExams,
      summary: this.calculateSummary(
        studySessions,
        quizSessions,
        questionStats,
        dailyStats,
      ),
      period: dateFilter ? {
        start: weekStart,
        end: weekEnd,
      } : null,
    };
  }

  /**
   * Haftalık analiz için veri toplama (önceki hafta ile karşılaştırma)
   */
  async collectWeeklyDataWithComparison(userId: string) {
    // Bu hafta (Pazartesi - Pazar)
    const now = new Date();
    const currentWeekStart = this.getWeekStart(now);
    const currentWeekEnd = this.getWeekEnd(now);

    // Önceki hafta
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(currentWeekEnd);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

    // Bu hafta ve önceki hafta verilerini topla
    const [currentWeekData, previousWeekData] = await Promise.all([
      this.collectUserData(userId, currentWeekStart, currentWeekEnd),
      this.collectUserData(userId, previousWeekStart, previousWeekEnd),
    ]);

    // Senaryo tespiti
    const scenario = this.detectScenario(currentWeekData, previousWeekData);

    return {
      currentWeek: {
        ...currentWeekData,
        weekStart: currentWeekStart,
        weekEnd: currentWeekEnd,
      },
      previousWeek: {
        ...previousWeekData,
        weekStart: previousWeekStart,
        weekEnd: previousWeekEnd,
      },
      scenario,
    };
  }

  /**
   * Kullanıcı durumunu tespit et (senaryo belirleme)
   */
  private detectScenario(currentWeek: any, previousWeek: any): {
    type: string;
    isNewUser: boolean;
    previousWeekEmpty: boolean;
    lowQuestionCount: boolean;
    lowStudyTime: boolean;
    hasEnoughData: boolean;
  } {
    const currentSummary = currentWeek.summary || {};
    const previousSummary = previousWeek?.summary || {};

    const totalQuestionsSolved = parseInt(currentSummary.totalQuestionsAttempted || 0);
    const totalStudyMinutes = parseInt(currentSummary.totalStudyMinutes || 0);

    const isNewUser = !previousWeek || 
      (parseInt(previousSummary.totalQuestionsAttempted || 0) === 0 && 
       parseInt(previousSummary.totalStudyMinutes || 0) === 0);

    const previousWeekEmpty = 
      parseInt(previousSummary.totalQuestionsAttempted || 0) === 0 &&
      parseInt(previousSummary.totalStudyMinutes || 0) === 0 &&
      (!previousWeek?.studySessions || previousWeek.studySessions.length === 0) &&
      (!previousWeek?.quizSessions || previousWeek.quizSessions.length === 0);

    const lowQuestionCount = totalQuestionsSolved < 10;
    const lowStudyTime = totalStudyMinutes < 300; // 5 saat = 300 dakika

    const hasEnoughData = 
      totalQuestionsSolved > 0 || 
      totalStudyMinutes > 0 ||
      (currentWeek.studySessions && currentWeek.studySessions.length > 0) ||
      (currentWeek.quizSessions && currentWeek.quizSessions.length > 0);

    let scenarioType = 'NORMAL';
    if (isNewUser) {
      scenarioType = 'NEW_USER';
    } else if (previousWeekEmpty) {
      scenarioType = 'FIRST_WEEK';
    } else if (lowQuestionCount || lowStudyTime) {
      scenarioType = 'LOW_ACTIVITY';
    } else if (totalQuestionsSolved >= 50 && totalStudyMinutes >= 600) {
      scenarioType = 'HIGH_PERFORMANCE';
    }

    return {
      type: scenarioType,
      isNewUser,
      previousWeekEmpty,
      lowQuestionCount,
      lowStudyTime,
      hasEnoughData,
    };
  }

  /**
   * Haftanın başlangıç gününü (Pazartesi) bulur
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi = 1
    return new Date(d.setDate(diff));
  }

  /**
   * Haftanın bitiş gününü (Pazar) bulur
   */
  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Pazar
    return weekEnd;
  }

  private async getStudySessions(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    const queryBuilder = this.studySessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.subject', 'subject')
      .where('session.userId = :userId', { userId });

    if (dateFilter) {
      queryBuilder.andWhere('session.startedAt >= :start', {
        start: dateFilter.start,
      });
      queryBuilder.andWhere('session.startedAt <= :end', {
        end: dateFilter.end,
      });
    } else {
      queryBuilder.orderBy('session.startedAt', 'DESC').take(100);
    }

    const sessions = await queryBuilder.getMany();

    return sessions.map((s) => ({
      id: s.id,
      duration: s.duration, // dakika
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      status: s.status,
      timerType: s.timerType,
      examCode: s.examCode,
      subjectName: s.subject?.name || null,
      subjectId: s.subjectId,
    }));
  }

  private async getQuizSessions(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    const queryBuilder = this.quizSessionRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId });

    if (dateFilter) {
      queryBuilder.andWhere('session.startedAt >= :start', {
        start: dateFilter.start,
      });
      queryBuilder.andWhere('session.startedAt <= :end', {
        end: dateFilter.end,
      });
    } else {
      queryBuilder.orderBy('session.startedAt', 'DESC').take(100);
    }

    const sessions = await queryBuilder.getMany();

    return sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      totalQuestions: s.totalQuestions,
      correctCount: s.correctCount,
      incorrectCount: s.incorrectCount,
      accuracy: s.totalQuestions > 0 
        ? ((s.correctCount / s.totalQuestions) * 100).toFixed(2)
        : 0,
      examCode: s.examCode,
    }));
  }

  private async getQuestionStatistics(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    const queryBuilder = this.questionStatisticRepository
      .createQueryBuilder('qs')
      .leftJoinAndSelect('qs.question', 'question')
      .leftJoinAndSelect('question.subject', 'subject')
      .leftJoinAndSelect('question.topic', 'topic')
      .where('qs.userId = :userId', { userId });

    if (dateFilter) {
      queryBuilder.andWhere('qs.lastAttemptedAt >= :start', {
        start: dateFilter.start,
      });
      queryBuilder.andWhere('qs.lastAttemptedAt <= :end', {
        end: dateFilter.end,
      });
    } else {
      queryBuilder.orderBy('qs.lastAttemptedAt', 'DESC').take(500);
    }

    const stats = await queryBuilder.getMany();

    return stats.map((s) => ({
      questionId: s.questionId,
      totalAttempts: s.totalAttempts,
      correctCount: s.correctCount,
      incorrectCount: s.incorrectCount,
      masteryLevel: s.masteryLevel,
      lastAttemptedAt: s.lastAttemptedAt,
      nextReviewAt: s.nextReviewAt,
      subjectName: s.question?.subject?.name || null,
      topicName: s.question?.topic?.name || null,
      examCode: s.question?.examCode || null,
    }));
  }

  private async getDailyStatistics(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    const queryBuilder = this.dailyStatisticRepository
      .createQueryBuilder('ds')
      .where('ds.userId = :userId', { userId });

    if (dateFilter) {
      queryBuilder.andWhere('ds.date >= :start', {
        start: dateFilter.start.toISOString().split('T')[0],
      });
      queryBuilder.andWhere('ds.date <= :end', {
        end: dateFilter.end.toISOString().split('T')[0],
      });
    } else {
      queryBuilder.orderBy('ds.date', 'DESC').take(90);
    }

    const stats = await queryBuilder.getMany();

    return stats.map((s) => ({
      date: s.date,
      questionsSolved: s.questionsSolved,
      correctCount: s.correctCount,
      incorrectCount: s.incorrectCount,
      accuracy: s.questionsSolved > 0
        ? ((s.correctCount / s.questionsSolved) * 100).toFixed(2)
        : 0,
    }));
  }

  private async getSubjectPerformance(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    let query = `
      SELECT 
        s.name as subject_name,
        COUNT(DISTINCT qs.question_id) as total_questions_attempted,
        SUM(qs.correct_count) as total_correct,
        SUM(qs.incorrect_count) as total_incorrect,
        SUM(qs.total_attempts) as total_attempts,
        ROUND(AVG(qs.mastery_level), 2) as avg_mastery_level,
        COUNT(DISTINCT CASE WHEN qs.mastery_level >= 3 THEN qs.question_id END) as mastered_questions
      FROM question_statistics qs
      INNER JOIN questions q ON qs.question_id = q.id
      INNER JOIN subjects s ON q.subject_id = s.id
      WHERE qs.user_id = $1::uuid
    `;

    const params: any[] = [userId];

    if (dateFilter) {
      query += ` AND qs.last_attempted_at >= $2::timestamp AND qs.last_attempted_at <= $3::timestamp`;
      params.push(dateFilter.start, dateFilter.end);
    }

    query += ` GROUP BY s.id, s.name ORDER BY total_questions_attempted DESC`;

    const result = await this.dataSource.query(query, params);

    return result.map((r: any) => ({
      subjectName: r.subject_name,
      totalQuestionsAttempted: parseInt(r.total_questions_attempted) || 0,
      totalCorrect: parseInt(r.total_correct) || 0,
      totalIncorrect: parseInt(r.total_incorrect) || 0,
      totalAttempts: parseInt(r.total_attempts) || 0,
      avgMasteryLevel: parseFloat(r.avg_mastery_level) || 0,
      masteredQuestions: parseInt(r.mastered_questions) || 0,
      accuracy: r.total_attempts > 0
        ? ((r.total_correct / r.total_attempts) * 100).toFixed(2)
        : 0,
    }));
  }

  private async getTopicPerformance(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    let query = `
      SELECT 
        t.name as topic_name,
        s.name as subject_name,
        COUNT(DISTINCT qs.question_id) as total_questions_attempted,
        SUM(qs.correct_count) as total_correct,
        SUM(qs.incorrect_count) as total_incorrect,
        SUM(qs.total_attempts) as total_attempts,
        ROUND(AVG(qs.mastery_level), 2) as avg_mastery_level
      FROM question_statistics qs
      INNER JOIN questions q ON qs.question_id = q.id
      INNER JOIN topics t ON q.topic_id = t.id
      INNER JOIN subjects s ON q.subject_id = s.id
      WHERE qs.user_id = $1::uuid
    `;

    const params: any[] = [userId];

    if (dateFilter) {
      query += ` AND qs.last_attempted_at >= $2::timestamp AND qs.last_attempted_at <= $3::timestamp`;
      params.push(dateFilter.start, dateFilter.end);
    }

    query += ` GROUP BY t.id, t.name, s.id, s.name ORDER BY total_questions_attempted DESC LIMIT 50`;

    const result = await this.dataSource.query(query, params);

    return result.map((r: any) => ({
      topicName: r.topic_name,
      subjectName: r.subject_name,
      totalQuestionsAttempted: parseInt(r.total_questions_attempted) || 0,
      totalCorrect: parseInt(r.total_correct) || 0,
      totalIncorrect: parseInt(r.total_incorrect) || 0,
      totalAttempts: parseInt(r.total_attempts) || 0,
      avgMasteryLevel: parseFloat(r.avg_mastery_level) || 0,
      accuracy: r.total_attempts > 0
        ? ((r.total_correct / r.total_attempts) * 100).toFixed(2)
        : 0,
    }));
  }

  private async getExamCodePerformance(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    let query = `
      SELECT 
        COALESCE(q.exam_code, 'GENEL') as exam_code,
        COUNT(DISTINCT qs.question_id) as total_questions_attempted,
        SUM(qs.correct_count) as total_correct,
        SUM(qs.incorrect_count) as total_incorrect,
        SUM(qs.total_attempts) as total_attempts,
        ROUND(AVG(qs.mastery_level), 2) as avg_mastery_level
      FROM question_statistics qs
      INNER JOIN questions q ON qs.question_id = q.id
      WHERE qs.user_id = $1::uuid
    `;

    const params: any[] = [userId];

    if (dateFilter) {
      query += ` AND qs.last_attempted_at >= $2::timestamp AND qs.last_attempted_at <= $3::timestamp`;
      params.push(dateFilter.start, dateFilter.end);
    }

    query += ` GROUP BY q.exam_code ORDER BY total_questions_attempted DESC`;

    const result = await this.dataSource.query(query, params);

    return result.map((r: any) => ({
      examCode: r.exam_code,
      totalQuestionsAttempted: parseInt(r.total_questions_attempted) || 0,
      totalCorrect: parseInt(r.total_correct) || 0,
      totalIncorrect: parseInt(r.total_incorrect) || 0,
      totalAttempts: parseInt(r.total_attempts) || 0,
      avgMasteryLevel: parseFloat(r.avg_mastery_level) || 0,
      accuracy: r.total_attempts > 0
        ? ((r.total_correct / r.total_attempts) * 100).toFixed(2)
        : 0,
    }));
  }

  private async getRecentQuizAnswers(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    const queryBuilder = this.quizAnswerRepository
      .createQueryBuilder('qa')
      .leftJoinAndSelect('qa.quizSession', 'quizSession')
      .leftJoinAndSelect('qa.question', 'question')
      .leftJoinAndSelect('question.subject', 'subject')
      .leftJoinAndSelect('question.topic', 'topic')
      .where('quizSession.userId = :userId', { userId });

    if (dateFilter) {
      queryBuilder.andWhere('qa.answeredAt >= :start', {
        start: dateFilter.start,
      });
      queryBuilder.andWhere('qa.answeredAt <= :end', {
        end: dateFilter.end,
      });
    } else {
      queryBuilder.orderBy('qa.answeredAt', 'DESC').take(200);
    }

    const answers = await queryBuilder.getMany();

    return answers.map((a) => ({
      questionId: a.questionId,
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      answeredAt: a.answeredAt,
      subjectName: a.question?.subject?.name || null,
      topicName: a.question?.topic?.name || null,
      examCode: a.question?.examCode || null,
      quizMode: a.quizSession.mode,
    }));
  }

  private async getMasteryDistribution(userId: string) {
    const result = await this.dataSource.query(
      `
      SELECT 
        mastery_level,
        COUNT(*) as question_count
      FROM question_statistics
      WHERE user_id = $1::uuid
      GROUP BY mastery_level
      ORDER BY mastery_level
    `,
      [userId],
    );

    return result.map((r: any) => ({
      masteryLevel: parseInt(r.mastery_level) || 0,
      questionCount: parseInt(r.question_count) || 0,
    }));
  }

  private async getTimeDistribution(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    // Haftalık ve aylık çalışma süresi dağılımı
    let weeklyQuery = `
      SELECT 
        DATE_TRUNC('week', started_at) as week_start,
        SUM(duration) as total_minutes,
        COUNT(*) as session_count
      FROM study_sessions
      WHERE user_id = $1::uuid
    `;

    const weeklyParams: any[] = [userId];

    if (dateFilter) {
      weeklyQuery += ` AND started_at >= $2::timestamp AND started_at <= $3::timestamp`;
      weeklyParams.push(dateFilter.start, dateFilter.end);
    } else {
      weeklyQuery += ` AND started_at >= NOW() - INTERVAL '12 weeks'`;
    }

    weeklyQuery += ` GROUP BY DATE_TRUNC('week', started_at) ORDER BY week_start DESC`;

    const weeklyResult = await this.dataSource.query(weeklyQuery, weeklyParams);

    let monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', started_at) as month_start,
        SUM(duration) as total_minutes,
        COUNT(*) as session_count
      FROM study_sessions
      WHERE user_id = $1::uuid
    `;

    const monthlyParams: any[] = [userId];

    if (dateFilter) {
      monthlyQuery += ` AND started_at >= $2::timestamp AND started_at <= $3::timestamp`;
      monthlyParams.push(dateFilter.start, dateFilter.end);
    } else {
      monthlyQuery += ` AND started_at >= NOW() - INTERVAL '12 months'`;
    }

    monthlyQuery += ` GROUP BY DATE_TRUNC('month', started_at) ORDER BY month_start DESC`;

    const monthlyResult = await this.dataSource.query(monthlyQuery, monthlyParams);

    return {
      weekly: weeklyResult.map((r: any) => ({
        weekStart: r.week_start,
        totalMinutes: parseInt(r.total_minutes) || 0,
        sessionCount: parseInt(r.session_count) || 0,
      })),
      monthly: monthlyResult.map((r: any) => ({
        monthStart: r.month_start,
        totalMinutes: parseInt(r.total_minutes) || 0,
        sessionCount: parseInt(r.session_count) || 0,
      })),
    };
  }

  /**
   * Deneme sınavlarını getir
   */
  private async getMockExams(
    userId: string,
    dateFilter?: { start: Date; end: Date } | null,
  ) {
    const queryBuilder = this.mockExamRepository
      .createQueryBuilder('mockExam')
      .leftJoinAndSelect('mockExam.subjectResults', 'subjectResults')
      .leftJoinAndSelect('subjectResults.subject', 'subject')
      .where('mockExam.userId = :userId', { userId });

    if (dateFilter) {
      queryBuilder.andWhere('mockExam.examDate >= :start', {
        start: dateFilter.start.toISOString().split('T')[0],
      });
      queryBuilder.andWhere('mockExam.examDate <= :end', {
        end: dateFilter.end.toISOString().split('T')[0],
      });
    } else {
      queryBuilder.orderBy('mockExam.examDate', 'DESC').take(50);
    }

    const mockExams = await queryBuilder.getMany();

    return mockExams.map((exam) => ({
      id: exam.id,
      examCode: exam.examCode,
      examName: exam.examName,
      examDate: exam.examDate,
      totalCorrect: exam.totalCorrect,
      totalWrong: exam.totalWrong,
      totalEmpty: exam.totalEmpty,
      totalNet: Number(exam.totalNet),
      isRecord: exam.isRecord,
      subjectResults: exam.subjectResults?.map((sr) => ({
        subjectName: sr.subject?.name || null,
        correctCount: sr.correctCount,
        wrongCount: sr.wrongCount,
        emptyCount: sr.emptyCount,
        net: Number(sr.net),
      })) || [],
    }));
  }

  private calculateSummary(
    studySessions: any[],
    quizSessions: any[],
    questionStats: any[],
    dailyStats: any[],
  ) {
    const totalStudyMinutes = studySessions.reduce(
      (sum, s) => sum + s.duration,
      0,
    );
    const totalQuizSessions = quizSessions.length;
    const totalQuestionsAttempted = questionStats.length;
    const totalCorrect = questionStats.reduce(
      (sum, s) => sum + s.correctCount,
      0,
    );
    const totalIncorrect = questionStats.reduce(
      (sum, s) => sum + s.incorrectCount,
      0,
    );
    const totalAttempts = questionStats.reduce(
      (sum, s) => sum + s.totalAttempts,
      0,
    );
    const avgAccuracy =
      totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(2) : 0;

    // Son 7 gün
    const last7Days = dailyStats
      .filter((d) => {
        const date = new Date(d.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      })
      .reduce(
        (acc, d) => {
          acc.questionsSolved += d.questionsSolved;
          acc.correctCount += d.correctCount;
          acc.incorrectCount += d.incorrectCount;
          return acc;
        },
        { questionsSolved: 0, correctCount: 0, incorrectCount: 0 },
      );

    // Son 30 gün
    const last30Days = dailyStats
      .filter((d) => {
        const date = new Date(d.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      })
      .reduce(
        (acc, d) => {
          acc.questionsSolved += d.questionsSolved;
          acc.correctCount += d.correctCount;
          acc.incorrectCount += d.incorrectCount;
          return acc;
        },
        { questionsSolved: 0, correctCount: 0, incorrectCount: 0 },
      );

    return {
      totalStudyHours: (totalStudyMinutes / 60).toFixed(2),
      totalStudyMinutes,
      totalQuizSessions,
      totalQuestionsAttempted,
      totalCorrect,
      totalIncorrect,
      totalAttempts,
      overallAccuracy: avgAccuracy,
      last7Days: {
        questionsSolved: last7Days.questionsSolved,
        correctCount: last7Days.correctCount,
        incorrectCount: last7Days.incorrectCount,
        accuracy:
          last7Days.questionsSolved > 0
            ? (
                (last7Days.correctCount / last7Days.questionsSolved) *
                100
              ).toFixed(2)
            : 0,
      },
      last30Days: {
        questionsSolved: last30Days.questionsSolved,
        correctCount: last30Days.correctCount,
        incorrectCount: last30Days.incorrectCount,
        accuracy:
          last30Days.questionsSolved > 0
            ? (
                (last30Days.correctCount / last30Days.questionsSolved) *
                100
              ).toFixed(2)
            : 0,
      },
    };
  }
}
