import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MotivationService } from '../motivation/motivation.service';
import { UsersService } from '../users/users.service';
import { PricingUsageService } from '../pricing/services/pricing-usage.service';
import { DetailedAnalysisStorageService } from './services/detailed-analysis-storage.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly motivationService: MotivationService,
    private readonly usersService: UsersService,
    private readonly pricingUsageService: PricingUsageService,
    private readonly analysisStorageService: DetailedAnalysisStorageService,
  ) {}

  private normalizeDate(value: Date | string) {
    if (value instanceof Date) {
      return value;
    }

    return new Date(`${value}T00:00:00`);
  }

  private formatDateYmd(date: Date | string) {
    const normalized = this.normalizeDate(date);
    const year = normalized.getFullYear();
    const month = `${normalized.getMonth() + 1}`.padStart(2, '0');
    const day = `${normalized.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Veritabanından AI analizini getir (kategori bazlı)
   * Plan kontrolü yapılır:
   * - Free: Tüm kategoriler için null
   * - Pro: Sadece 'general' kategorisi için analiz, diğerleri null
   * - Premium: Tüm kategoriler için analiz
   * @param userId Kullanıcı ID
   * @param range Hafta/Ay/Tümü
   * @param category Analiz kategorisi: 'general' | 'questions' | 'time' | 'mockExams'
   * @returns Analiz metni veya null
   */
  private async getAiAnalysisForCategory(
    userId: string,
    range: 'week' | 'month' | 'all',
    category: 'general' | 'questions' | 'time' | 'mockExams',
  ): Promise<string | null> {
    try {
      // Plan kontrolü
      const { plan } = await this.pricingUsageService.getActivePlan(userId);
      const isFree = plan.code === 'free_tier';
      const isPro = plan.code === 'pro_tier';
      const isPremium = plan.code === 'premium_tier';

      // Free kullanıcılar için analiz yok
      if (isFree) {
        return null;
      }

      // Pro kullanıcılar için sadece 'general' kategorisi
      if (isPro && category !== 'general') {
        return null;
      }

      // Premium kullanıcılar için tüm kategoriler, Pro için sadece general
      // Range'e göre analiz haftasını belirle
      let weekStart: Date | null = null;
      
      if (range === 'week') {
        // Önceki hafta için analiz (job'un oluşturduğu)
        const now = new Date();
        const currentWeekStart = this.getWeekStart(now);
        weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - 7); // Önceki hafta
        weekStart.setHours(0, 0, 0, 0);
      } else if (range === 'month') {
        // Önceki ayın son haftası için analiz
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        weekStart = this.getWeekStart(firstDayOfMonth);
        weekStart.setDate(weekStart.getDate() - 7); // Önceki ayın son haftası
        weekStart.setHours(0, 0, 0, 0);
      } else {
        // 'all' için en son analizi getir
        const latest = await this.analysisStorageService.getLatestAnalysis(userId);
        if (!latest) return null;

        let parsedAnalysis: any;
        if (latest.categories && typeof latest.categories === 'object') {
          parsedAnalysis = latest.categories;
        } else {
          try {
            parsedAnalysis = JSON.parse(latest.analysisText);
          } catch {
            parsedAnalysis = { general: latest.summary || latest.analysisText || '' };
          }
        }

        return parsedAnalysis[category] || null;
      }

      if (!weekStart) return null;

      // Belirli hafta için analiz getir
      const analysis = await this.analysisStorageService.getOrCheckAnalysisForWeek(
        userId,
        weekStart,
      );

      if (!analysis) return null;

      // Analizi parse et
      let parsedAnalysis: any;
      if (analysis.categories && typeof analysis.categories === 'object') {
        parsedAnalysis = analysis.categories;
      } else {
        try {
          parsedAnalysis = JSON.parse(analysis.analysisText);
        } catch {
          parsedAnalysis = { general: analysis.summary || analysis.analysisText || '' };
        }
      }

      return parsedAnalysis[category] || null;
    } catch (error) {
      return null;
    }
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

  private buildRange(range: 'week' | 'month' | 'all') {
    const now = new Date();
    const endExclusive = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    if (range === 'all') {
      return {
        range,
        start: null,
        endExclusive,
        previousStart: null,
        previousEndExclusive: null,
        days: null,
      };
    }

    const days = range === 'week' ? 7 : 30;
    const start = new Date(endExclusive);
    start.setDate(start.getDate() - days);

    const previousEndExclusive = new Date(start);
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - days);

    return {
      range,
      start,
      endExclusive,
      previousStart,
      previousEndExclusive,
      days,
    };
  }

  private buildRangeInfo(rangeInfo: ReturnType<AnalyticsService['buildRange']>) {
    const toDateString = (date: Date | null) =>
      date ? this.formatDateYmd(date) : null;

    return {
      range: rangeInfo.range,
      startDate: toDateString(rangeInfo.start),
      endDate: rangeInfo.endExclusive
        ? toDateString(new Date(rangeInfo.endExclusive.getTime() - 86400000))
        : null,
      previousStartDate: toDateString(rangeInfo.previousStart),
      previousEndDate: rangeInfo.previousEndExclusive
        ? toDateString(
            new Date(rangeInfo.previousEndExclusive.getTime() - 86400000),
          )
        : null,
    };
  }

  private calculatePercentageChange(current: number, previous: number) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private async hasStudySessionsTimerTypeColumn() {
    try {
      const result = await this.dataSource.query(
        `
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'study_sessions'
          AND column_name = 'timer_type'
        LIMIT 1
      `,
      );
      return result.length > 0;
    } catch {
      return false;
    }
  }

  private pickPeakWindow(hourlyMinutes: Array<{ hour: number; minutes: number }>) {
    if (!hourlyMinutes.length) {
      return null;
    }

    const minutesByHour = new Array(24).fill(0);
    hourlyMinutes.forEach((entry) => {
      minutesByHour[entry.hour] = entry.minutes;
    });

    let bestStart = 0;
    let bestTotal = -1;

    for (let start = 0; start < 24; start += 1) {
      const total =
        minutesByHour[start] +
        minutesByHour[(start + 1) % 24] +
        minutesByHour[(start + 2) % 24];

      if (total > bestTotal) {
        bestTotal = total;
        bestStart = start;
      }
    }

    return {
      from: bestStart,
      to: (bestStart + 3) % 24,
    };
  }

  async getAnalyticsOverview(userId: string) {
    try {
      const totalStatsQuery = this.dataSource.query(
        `
        SELECT
          COALESCE(SUM(questions_solved), 0) AS "totalQuestionsSolved",
          COALESCE(SUM(correct_count), 0) AS "totalCorrect",
          COALESCE(SUM(incorrect_count), 0) AS "totalIncorrect"
        FROM daily_statistics
        WHERE user_id = $1
      `,
        [userId],
      ).catch(() => [{ totalQuestionsSolved: 0, totalCorrect: 0, totalIncorrect: 0 }]);

      const totalQuestionsAddedQuery = this.dataSource.query(
        `
        SELECT
          COUNT(*) AS "totalQuestionsAdded"
        FROM questions
        WHERE user_id = $1
      `,
        [userId],
      ).catch(() => [{ totalQuestionsAdded: 0 }]);

      const weeklyActivityQuery = this.dataSource.query(
        `
        SELECT
          week_start as "week",
          total_solved as "questionsSolved",
          total_correct as "correctCount",
          total_incorrect as "incorrectCount"
        FROM weekly_activity
        WHERE user_id = $1
        ORDER BY week_start DESC
      `,
        [userId],
      ).catch(() => []);

      const subjectBreakdownQuery = this.dataSource.query(
        `
        SELECT
          s.id AS "subjectId",
          s.name AS "subjectName",
          SUM(qs.correct_count + qs.incorrect_count) AS "questionsSolved",
          SUM(qs.correct_count) AS "correctCount",
          SUM(qs.incorrect_count) AS "incorrectCount"
        FROM
          question_statistics qs
        JOIN
          questions q ON qs.question_id = q.id
        JOIN
          subjects s ON q.subject_id = s.id
        WHERE
          qs.user_id = $1
        GROUP BY
          s.id, s.name
      `,
        [userId],
      ).catch(() => []);

      const [
        totalStatsResult,
        totalQuestionsAddedResult,
        weeklyActivityResult,
        subjectBreakdownResult,
      ] = await Promise.all([
        totalStatsQuery,
        totalQuestionsAddedQuery,
        weeklyActivityQuery,
        subjectBreakdownQuery,
      ]);

      const totalStats = totalStatsResult[0] || { totalQuestionsSolved: 0, totalCorrect: 0, totalIncorrect: 0 };
      const totalQuestionsAdded = totalQuestionsAddedResult[0]?.totalQuestionsAdded || 0;

      const overallAccuracy =
        totalStats.totalQuestionsSolved > 0
          ? parseFloat(
              ((totalStats.totalCorrect / totalStats.totalQuestionsSolved) * 100).toFixed(2),
            )
          : 0;

      let recordWeekQuestionsSolved = 0;
      if (weeklyActivityResult && weeklyActivityResult.length > 0) {
        recordWeekQuestionsSolved = Math.max(
          ...weeklyActivityResult.map(w => w.questionsSolved || 0),
        );
      }

      const weeklyActivity = (weeklyActivityResult || []).map(w => ({
        ...w,
        week: this.formatDateYmd(new Date(w.week)),
        isRecordWeek:
          w.questionsSolved === recordWeekQuestionsSolved &&
          recordWeekQuestionsSolved > 0,
      }));

      const subjectBreakdown = (subjectBreakdownResult || []).map(s => ({
        ...s,
        accuracy:
          s.questionsSolved > 0
            ? parseFloat(((s.correctCount / s.questionsSolved) * 100).toFixed(2))
            : 0,
      }));

      // Motivasyon mesajını al
      const motivation = await this.motivationService.getMotivationForUser(userId);

      return {
        totalQuestionsSolved: Number(totalStats.totalQuestionsSolved || 0),
        totalCorrect: Number(totalStats.totalCorrect || 0),
        totalIncorrect: Number(totalStats.totalIncorrect || 0),
        overallAccuracy,
        totalQuestionsAdded: Number(totalQuestionsAdded),
        weeklyActivity,
        subjectBreakdown,
        motivation,
      };
    } catch (error) {
      // Return empty/default data if any error occurs
      return {
        totalQuestionsSolved: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        overallAccuracy: 0,
        totalQuestionsAdded: 0,
        weeklyActivity: [],
        subjectBreakdown: [],
        motivation: {
          title: 'Başarıya Giden Yoldasın! 🚀',
          message: 'Her gün biraz daha ilerliyorsun!',
          type: 'general',
        },
      };
    }
  }

  private getISOWeek(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
  }

  async getWeeklyActivity(userId: string, weeks: number) {
    try {
      const weeklyActivityRaw: any[] = await this.dataSource.query(
        'SELECT * FROM weekly_activity WHERE user_id = $1 ORDER BY week_start DESC LIMIT $2',
        [userId, weeks],
      ).catch(() => []);

      if (!weeklyActivityRaw || !weeklyActivityRaw.length) {
        return {
          success: true,
          data: {
            weeks: [],
            recordWeek: null,
          },
        };
      }

    let maxQuestionsSolved = 0;
    for (const weekData of weeklyActivityRaw) {
      const questionsSolved = parseInt(weekData.total_solved, 10) || 0;
      if (questionsSolved > maxQuestionsSolved) {
        maxQuestionsSolved = questionsSolved;
      }
    }

    let recordWeek: { week: string; questionsSolved: number } | null = null;

    const formattedWeeks = weeklyActivityRaw
      .map(weekData => {
        const questionsSolved = parseInt(weekData.total_solved, 10) || 0;
        const correctCount = parseInt(weekData.total_correct, 10) || 0;
        const accuracy =
          questionsSolved > 0
            ? (correctCount / questionsSolved) * 100
            : 0;

        const weekStart = new Date(weekData.week_start);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

        const year = weekStart.getUTCFullYear();
        const weekNumber = this.getISOWeek(weekStart);
        const weekIdentifier = `${year}-W${weekNumber
          .toString()
          .padStart(2, '0')}`;

        const isRecordWeek =
          questionsSolved === maxQuestionsSolved && maxQuestionsSolved > 0;

        if (isRecordWeek) {
          recordWeek = {
            week: weekIdentifier,
            questionsSolved: questionsSolved,
          };
        }

        return {
          week: weekIdentifier,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          questionsSolved: questionsSolved,
          correctCount: correctCount,
          incorrectCount: parseInt(weekData.total_incorrect, 10) || 0,
          accuracy: parseFloat(accuracy.toFixed(2)),
          isRecordWeek: isRecordWeek,
        };
      })
      .sort((a, b) => a.week.localeCompare(b.week));

      return {
        success: true,
        data: {
          weeks: formattedWeeks,
          recordWeek: recordWeek,
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          weeks: [],
          recordWeek: null,
        },
      };
    }
  }

  async getSubjectStatistics(userId: string) {
    try {
      const query = `
        SELECT
            s.id AS "subjectId",
            s.name AS "subjectName",
            COUNT(q.id) AS "totalQuestions",
            COUNT(DISTINCT qs.question_id) AS "questionsSolved",
            COALESCE(SUM(qs.correct_count), 0) AS "correctCount",
            COALESCE(SUM(qs.incorrect_count), 0) AS "incorrectCount"
        FROM
            questions q
        JOIN
            subjects s ON q.subject_id = s.id
        LEFT JOIN
            question_statistics qs ON q.id = qs.question_id AND qs.user_id = q.user_id
        WHERE
            q.user_id = $1
        GROUP BY
            s.id, s.name
        ORDER BY
            s.name;
      `;

      const subjectStatsRaw = await this.dataSource.query(query, [userId]).catch(() => []);

      const subjects = (subjectStatsRaw || []).map(s => {
        const correctCount = Number(s.correctCount);
        const incorrectCount = Number(s.incorrectCount);
        const totalAttempts = correctCount + incorrectCount;
        const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

        return {
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          totalQuestions: Number(s.totalQuestions),
          questionsSolved: Number(s.questionsSolved),
          correctCount,
          incorrectCount,
          accuracy: parseFloat(accuracy.toFixed(2)),
        };
      });

      return { subjects };
    } catch (error) {
      return { subjects: [] };
    }
  }

  async getAnalysisGeneral(userId: string, range: 'week' | 'month' | 'all') {
    const rangeInfo = this.buildRange(range);
    const period = this.buildRangeInfo(rangeInfo);

    // Check if user has advanced_analytics feature
    let hasAdvancedAnalytics = false;
    try {
      hasAdvancedAnalytics = await this.pricingUsageService.checkAccess(userId, 'advanced_analytics');
    } catch {
      // If check fails, user doesn't have access
      hasAdvancedAnalytics = false;
    }

    try {
      const studyParams: any[] = [userId];
      let studyDateFilter = '';
      if (rangeInfo.start) {
        studyParams.push(rangeInfo.start, rangeInfo.endExclusive);
        studyDateFilter = 'AND started_at >= $2 AND started_at < $3';
      }

      const [studyTotalRes, studyPrevRes] = await Promise.all([
        this.dataSource.query(
          `
          SELECT COALESCE(SUM(duration), 0)::int AS minutes
          FROM study_sessions
          WHERE user_id = $1::uuid
            AND status = 'COMPLETED'
            ${studyDateFilter}
        `,
          studyParams,
        ),
        rangeInfo.previousStart
          ? this.dataSource.query(
              `
              SELECT COALESCE(SUM(duration), 0)::int AS minutes
              FROM study_sessions
              WHERE user_id = $1::uuid
                AND status = 'COMPLETED'
                AND started_at >= $2
                AND started_at < $3
            `,
              [userId, rangeInfo.previousStart, rangeInfo.previousEndExclusive],
            )
          : Promise.resolve([{ minutes: 0 }]),
      ]);

      const totalStudyMinutes = Number(studyTotalRes[0]?.minutes || 0);
      const previousStudyMinutes = Number(studyPrevRes[0]?.minutes || 0);
      const studyDeltaPercent = this.calculatePercentageChange(
        totalStudyMinutes,
        previousStudyMinutes,
      );

      const questionParams: any[] = [userId];
      let questionDateFilter = '';
      if (rangeInfo.start) {
        questionParams.push(rangeInfo.start, rangeInfo.endExclusive);
        questionDateFilter = 'AND qa.answered_at >= $2 AND qa.answered_at < $3';
      }

      const questionRes = await this.dataSource.query(
        `
        SELECT
          COUNT(*)::int AS "totalSolved",
          COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END), 0)::int AS "correctCount",
          COALESCE(SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END), 0)::int AS "incorrectCount"
        FROM quiz_answers qa
        INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
        WHERE qs.user_id = $1::uuid
        ${questionDateFilter}
      `,
        questionParams,
      );

      const totalSolved = Number(questionRes[0]?.totalSolved || 0);
      const correctCount = Number(questionRes[0]?.correctCount || 0);
      const incorrectCount = Number(questionRes[0]?.incorrectCount || 0);
      const accuracyPercent =
        totalSolved > 0
          ? Number(((correctCount / totalSolved) * 100).toFixed(2))
          : 0;

      const focusDays = rangeInfo.days ?? 7;
      const focusStart = new Date(rangeInfo.endExclusive);
      focusStart.setUTCDate(focusStart.getUTCDate() - focusDays);

      const dailyFocusRes = await this.dataSource.query(
        `
        WITH days AS (
          SELECT generate_series($2::date, ($3::date - interval '1 day')::date, interval '1 day')::date AS date
        )
        SELECT
          d.date,
          COALESCE(SUM(s.duration), 0)::int AS minutes
        FROM days d
        LEFT JOIN study_sessions s
          ON DATE(s.started_at) = d.date
          AND s.user_id = $1::uuid
          AND s.status = 'COMPLETED'
        GROUP BY d.date
        ORDER BY d.date
      `,
        [userId, focusStart, rangeInfo.endExclusive],
      );

      const hourlyParams: any[] = [userId];
      let hourlyDateFilter = '';
      if (rangeInfo.start) {
        hourlyParams.push(rangeInfo.start, rangeInfo.endExclusive);
        hourlyDateFilter = 'AND started_at >= $2 AND started_at < $3';
      }

      const hourlyRes = await this.dataSource.query(
        `
        SELECT
          EXTRACT(HOUR FROM started_at)::int AS hour,
          COALESCE(SUM(duration), 0)::int AS minutes
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
          ${hourlyDateFilter}
        GROUP BY hour
      `,
        hourlyParams,
      );

      const peakHour = this.pickPeakWindow(
        (hourlyRes || []).map((row) => ({
          hour: Number(row.hour),
          minutes: Number(row.minutes || 0),
        })),
      );

      const lastExamRangeParams: any[] = [userId];
      let lastExamDateFilter = '';
      if (rangeInfo.start) {
        lastExamRangeParams.push(rangeInfo.start, rangeInfo.endExclusive);
        lastExamDateFilter = 'AND exam_date >= $2 AND exam_date < $3';
      }

      const lastExams = await this.dataSource.query(
        `
        SELECT exam_code, exam_name, exam_date, total_net
        FROM mock_exams
        WHERE user_id = $1::uuid
        ${lastExamDateFilter}
        ORDER BY exam_date DESC
        LIMIT 2
      `,
        lastExamRangeParams,
      );

      let examCode = lastExams[0]?.exam_code || null;
      if (!examCode) {
        const fallback = await this.dataSource.query(
          `
          SELECT exam_code, exam_name, exam_date, total_net
          FROM mock_exams
          WHERE user_id = $1::uuid
          ORDER BY exam_date DESC
          LIMIT 2
        `,
          [userId],
        );
        examCode = fallback[0]?.exam_code || null;
        if (!lastExams.length) {
          lastExams.push(...fallback);
        }
      }

      let averageNet = 0;
      let targetNet = 0;
      let progressPercent = 0;
      let remainingNet = 0;

      if (examCode) {
        const averageParams: any[] = [userId, examCode];
        let averageDateFilter = '';
        if (rangeInfo.start) {
          averageParams.push(rangeInfo.start, rangeInfo.endExclusive);
          averageDateFilter = 'AND exam_date >= $3 AND exam_date < $4';
        }

        const averageRes = await this.dataSource.query(
          `
          SELECT COALESCE(AVG(total_net), 0) AS average_net
          FROM mock_exams
          WHERE user_id = $1::uuid
            AND exam_code = $2
            ${averageDateFilter}
        `,
          averageParams,
        );

        averageNet = Number(averageRes[0]?.average_net || 0);

        const targetRes = await this.dataSource.query(
          `
          SELECT target_net
          FROM exam_target_goals
          WHERE user_id = $1::uuid
            AND exam_code = $2
          LIMIT 1
        `,
          [userId, examCode],
        );

        targetNet = Number(targetRes[0]?.target_net || 0);
        remainingNet = targetNet > 0 ? Number((targetNet - averageNet).toFixed(2)) : 0;
        progressPercent =
          targetNet > 0 ? Number(((averageNet / targetNet) * 100).toFixed(2)) : 0;
      }

      const lastNet = Number(lastExams[0]?.total_net || 0);
      const previousNet = Number(lastExams[1]?.total_net || 0);
      const netDelta = Number((lastNet - previousNet).toFixed(2));

      // If user doesn't have advanced_analytics, return limited data
      if (!hasAdvancedAnalytics) {
        // Free kullanıcılar için aiAnalysis null (helper metod zaten kontrol ediyor)
        const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'general').catch(() => null);

        return {
          period,
          isLimited: true,
          upgradeMessage: 'Detaylı analizler için Pro veya Premium plana geçin',
          totalProductivity: {
            totalStudyMinutes,
            studyDeltaPercent,
            questionsSolved: totalSolved,
            accuracyPercent,
            correctCount,
            incorrectCount,
          },
          examSummary: lastExams[0]
            ? {
                examCode,
                lastExam: {
                  examName: lastExams[0].exam_name,
                  examDate: lastExams[0].exam_date,
                  net: lastNet,
                },
              }
            : null,
          aiAnalysis: aiAnalysis || null,
        };
      }

      // Full analytics for advanced_analytics users
      const motivation = await this.motivationService.getMotivationForUser(userId);

      // AI analizini getir (general kategorisi)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'general');

      return {
        period,
        isLimited: false,
        coachInsight: {
          ...motivation,
          ctaLabel: 'Detaylı Raporu Gör',
        },
        totalProductivity: {
          totalStudyMinutes,
          studyDeltaPercent,
          questionsSolved: totalSolved,
          accuracyPercent,
          correctCount,
          incorrectCount,
        },
        timeAnalysis: {
          dailyFocus: (dailyFocusRes || []).map((row) => ({
            date: this.formatDateYmd(row.date),
            minutes: Number(row.minutes || 0),
          })),
          peakHour,
        },
        examSummary: {
          examCode,
          averageNet: Number(averageNet.toFixed(2)),
          targetNet,
          remainingNet,
          progressPercent,
          lastExam: lastExams[0]
            ? {
                examName: lastExams[0].exam_name,
                examDate: lastExams[0].exam_date,
                net: lastNet,
                delta: netDelta,
              }
            : null,
        },
        aiAnalysis: aiAnalysis || null,
      };
    } catch (error) {
      // AI analizini getir (hata durumunda da deneyelim)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'general').catch(() => null);

      return {
        period,
        coachInsight: {
          title: 'Başarıya Giden Yoldasın! 🚀',
          message: 'Her gün biraz daha ilerliyorsun!',
          type: 'general',
          ctaLabel: 'Detaylı Raporu Gör',
        },
        totalProductivity: {
          totalStudyMinutes: 0,
          studyDeltaPercent: 0,
          questionsSolved: 0,
          accuracyPercent: 0,
          correctCount: 0,
          incorrectCount: 0,
        },
        timeAnalysis: {
          dailyFocus: [],
          peakHour: null,
        },
        examSummary: {
          examCode: null,
          averageNet: 0,
          targetNet: 0,
          remainingNet: 0,
          progressPercent: 0,
          lastExam: null,
        },
        aiAnalysis: aiAnalysis || null,
      };
    }
  }

  async getAnalysisQuestions(userId: string, range: 'week' | 'month' | 'all') {
    const rangeInfo = this.buildRange(range);
    const period = this.buildRangeInfo(rangeInfo);

    try {
      const subjectParams: any[] = [userId];
      let subjectDateFilter = '';
      if (rangeInfo.start) {
        subjectParams.push(rangeInfo.start, rangeInfo.endExclusive);
        subjectDateFilter = 'AND qa.answered_at >= $2 AND qa.answered_at < $3';
      }

      const subjectRes = await this.dataSource.query(
        `
        SELECT
          s.id AS "subjectId",
          s.name AS "subjectName",
          COUNT(qa.id)::int AS "totalAttempts",
          COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END), 0)::int AS "correctCount",
          COALESCE(SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END), 0)::int AS "incorrectCount"
        FROM quiz_answers qa
        INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
        INNER JOIN questions q ON qa.question_id = q.id
        INNER JOIN subjects s ON q.subject_id = s.id
        WHERE qs.user_id = $1::uuid
        ${subjectDateFilter}
        GROUP BY s.id, s.name
        ORDER BY "totalAttempts" DESC
      `,
        subjectParams,
      );

      const subjectPerformance = (subjectRes || []).map((row) => {
        const totalAttempts = Number(row.totalAttempts || 0);
        const correctCount = Number(row.correctCount || 0);
        const incorrectCount = Number(row.incorrectCount || 0);
        const accuracyPercent =
          totalAttempts > 0
            ? Number(((correctCount / totalAttempts) * 100).toFixed(2))
            : 0;

        return {
          subjectId: row.subjectId,
          subjectName: row.subjectName,
          totalAttempts,
          correctCount,
          incorrectCount,
          accuracyPercent,
        };
      });

      const topicParams: any[] = [userId];
      let topicDateFilter = '';
      if (rangeInfo.start) {
        topicParams.push(rangeInfo.start, rangeInfo.endExclusive);
        topicDateFilter = 'AND qa.answered_at >= $2 AND qa.answered_at < $3';
      }

      const weakTopicsRes = await this.dataSource.query(
        `
        SELECT
          t.id AS "topicId",
          t.name AS "topicName",
          s.name AS "subjectName",
          COUNT(qa.id)::int AS "totalAttempts",
          COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END), 0)::int AS "correctCount",
          COALESCE(SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END), 0)::int AS "incorrectCount"
        FROM quiz_answers qa
        INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
        INNER JOIN questions q ON qa.question_id = q.id
        INNER JOIN topics t ON q.topic_id = t.id
        INNER JOIN subjects s ON q.subject_id = s.id
        WHERE qs.user_id = $1::uuid
        ${topicDateFilter}
        GROUP BY t.id, t.name, s.name
        HAVING COUNT(qa.id) >= 5
        ORDER BY
          (COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END), 0)::float / NULLIF(COUNT(qa.id), 0)) ASC
        LIMIT 5
      `,
        topicParams,
      );

      const weakTopics = (weakTopicsRes || []).map((row) => {
        const totalAttempts = Number(row.totalAttempts || 0);
        const correctCount = Number(row.correctCount || 0);
        const incorrectCount = Number(row.incorrectCount || 0);
        const accuracyPercent =
          totalAttempts > 0
            ? Number(((correctCount / totalAttempts) * 100).toFixed(2))
            : 0;

        return {
          topicId: row.topicId,
          topicName: row.topicName,
          subjectName: row.subjectName,
          totalAttempts,
          correctCount,
          incorrectCount,
          accuracyPercent,
        };
      });

      const [
        totalQuestionsRes,
        learnedRes,
        incorrectRes,
        newRes,
      ] = await Promise.all([
        this.dataSource.query(
          `
          SELECT COUNT(*)::int AS total
          FROM questions
          WHERE user_id = $1::uuid
        `,
          [userId],
        ),
        this.dataSource.query(
          `
          SELECT COUNT(*)::int AS total
          FROM question_statistics
          WHERE user_id = $1::uuid
            AND mastery_level >= 3
        `,
          [userId],
        ),
        this.dataSource.query(
          `
          SELECT COUNT(*)::int AS total
          FROM question_statistics
          WHERE user_id = $1::uuid
            AND incorrect_count > 0
        `,
          [userId],
        ),
        this.dataSource.query(
          `
          SELECT COUNT(*)::int AS total
          FROM questions q
          LEFT JOIN question_statistics qs
            ON qs.question_id = q.id
            AND qs.user_id = q.user_id
          WHERE q.user_id = $1::uuid
            AND (qs.id IS NULL OR qs.total_attempts = 0)
        `,
          [userId],
        ),
      ]);

      // AI analizini getir (questions kategorisi)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'questions');

      return {
        period,
        subjectPerformance,
        weakTopics,
        questionPool: {
          total: Number(totalQuestionsRes[0]?.total || 0),
          learned: Number(learnedRes[0]?.total || 0),
          incorrect: Number(incorrectRes[0]?.total || 0),
          new: Number(newRes[0]?.total || 0),
        },
        aiAnalysis: aiAnalysis || null,
      };
    } catch (error) {
      // AI analizini getir (hata durumunda da deneyelim)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'questions').catch(() => null);

      return {
        period,
        subjectPerformance: [],
        weakTopics: [],
        questionPool: {
          total: 0,
          learned: 0,
          incorrect: 0,
          new: 0,
        },
        aiAnalysis: aiAnalysis || null,
      };
    }
  }

  async getAnalysisTime(userId: string, range: 'week' | 'month' | 'all') {
    const rangeInfo = this.buildRange(range);
    const period = this.buildRangeInfo(rangeInfo);

    try {
      const hasTimerType = await this.hasStudySessionsTimerTypeColumn();
      const rangeParams: any[] = [userId];
      let rangeDateFilter = '';
      if (rangeInfo.start) {
        rangeParams.push(rangeInfo.start, rangeInfo.endExclusive);
        rangeDateFilter = 'AND started_at >= $2 AND started_at < $3';
      }

      const focusStart = rangeInfo.start ?? new Date(rangeInfo.endExclusive);
      if (!rangeInfo.start) {
        focusStart.setDate(focusStart.getDate() - 7);
      }

      const weeklyFocusRes = await this.dataSource.query(
        hasTimerType
          ? `
            WITH days AS (
              SELECT generate_series($2::date, ($3::date - interval '1 day')::date, interval '1 day')::date AS date
            )
            SELECT
              d.date,
              COALESCE(SUM(CASE WHEN ss.timer_type = 'POMODORO' THEN ss.duration ELSE 0 END), 0)::int AS "pomodoroMinutes",
              COALESCE(SUM(CASE WHEN ss.timer_type = 'FREE_TIMER' THEN ss.duration ELSE 0 END), 0)::int AS "freeTimerMinutes"
            FROM days d
            LEFT JOIN study_sessions ss
              ON DATE(ss.started_at) = d.date
              AND ss.user_id = $1::uuid
              AND ss.status = 'COMPLETED'
            GROUP BY d.date
            ORDER BY d.date
          `
          : `
            WITH days AS (
              SELECT generate_series($2::date, ($3::date - interval '1 day')::date, interval '1 day')::date AS date
            )
            SELECT
              d.date,
              COALESCE(SUM(ss.duration), 0)::int AS "pomodoroMinutes",
              0::int AS "freeTimerMinutes"
            FROM days d
            LEFT JOIN study_sessions ss
              ON DATE(ss.started_at) = d.date
              AND ss.user_id = $1::uuid
              AND ss.status = 'COMPLETED'
            GROUP BY d.date
            ORDER BY d.date
          `,
        [userId, focusStart, rangeInfo.endExclusive],
      );

      const subjectParams: any[] = [userId];
      let subjectDateFilter = '';
      if (rangeInfo.start) {
        subjectParams.push(rangeInfo.start, rangeInfo.endExclusive);
        subjectDateFilter = 'AND ss.started_at >= $2 AND ss.started_at < $3';
      }

      const subjectRes = await this.dataSource.query(
        `
        SELECT
          s.id AS "subjectId",
          s.name AS "subjectName",
          COALESCE(SUM(ss.duration), 0)::int AS "totalMinutes"
        FROM study_sessions ss
        INNER JOIN subjects s ON ss.subject_id = s.id
        WHERE ss.user_id = $1::uuid
          AND ss.status = 'COMPLETED'
          AND ss.subject_id IS NOT NULL
          ${subjectDateFilter}
        GROUP BY s.id, s.name
        ORDER BY "totalMinutes" DESC
      `,
        subjectParams,
      );

      const dayCountRes = await this.dataSource.query(
        `
        SELECT COUNT(DISTINCT DATE(started_at))::int AS days
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
          ${rangeDateFilter}
      `,
        rangeParams,
      );

      const rangeDays =
        rangeInfo.days ?? Math.max(Number(dayCountRes[0]?.days || 0), 1);
      const weeksInRange = Math.max(Math.ceil(rangeDays / 7), 1);
      const monthsInRange = Math.max(Math.ceil(rangeDays / 30), 1);

      const subjectDistribution = (subjectRes || []).map((row) => {
        const totalMinutes = Number(row.totalMinutes || 0);
        return {
          subjectId: row.subjectId,
          subjectName: row.subjectName,
          totalMinutes,
          dailyAverageMinutes: Number((totalMinutes / rangeDays).toFixed(2)),
          weeklyAverageMinutes: Number((totalMinutes / weeksInRange).toFixed(2)),
          monthlyAverageMinutes: Number((totalMinutes / monthsInRange).toFixed(2)),
        };
      });

      const totalMinutesRes = await this.dataSource.query(
        `
        SELECT COALESCE(SUM(duration), 0)::int AS minutes
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
          ${rangeDateFilter}
      `,
        rangeParams,
      );

      const periodTotalMinutes = Number(totalMinutesRes[0]?.minutes || 0);

      const longestRes = await this.dataSource.query(
        hasTimerType
          ? `
            SELECT duration, timer_type
            FROM study_sessions
            WHERE user_id = $1::uuid
              AND status = 'COMPLETED'
              ${rangeDateFilter}
            ORDER BY duration DESC
            LIMIT 1
          `
          : `
            SELECT duration, NULL::varchar AS timer_type
            FROM study_sessions
            WHERE user_id = $1::uuid
              AND status = 'COMPLETED'
              ${rangeDateFilter}
            ORDER BY duration DESC
            LIMIT 1
          `,
        rangeParams,
      );

      const heatmapRes = await this.dataSource.query(
        `
        SELECT
          EXTRACT(DOW FROM started_at)::int AS "dayOfWeek",
          EXTRACT(HOUR FROM started_at)::int AS hour,
          COALESCE(SUM(duration), 0)::int AS minutes
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
          ${rangeDateFilter}
        GROUP BY "dayOfWeek", hour
        ORDER BY "dayOfWeek", hour
      `,
        rangeParams,
      );

      // AI analizini getir (time kategorisi)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'time');

      return {
        period,
        weeklyFocus: (weeklyFocusRes || []).map((row) => ({
          date: this.formatDateYmd(row.date),
          pomodoroMinutes: Number(row.pomodoroMinutes || 0),
          freeTimerMinutes: Number(row.freeTimerMinutes || 0),
          totalMinutes:
            Number(row.pomodoroMinutes || 0) + Number(row.freeTimerMinutes || 0),
        })),
        subjectDistribution,
        totals: {
          periodTotalMinutes,
          dailyAverageMinutes: Number(
            (periodTotalMinutes / rangeDays).toFixed(2),
          ),
          longestSessionMinutes: Number(longestRes[0]?.duration || 0),
          longestSessionType: longestRes[0]?.timer_type || null,
        },
        heatmap: (heatmapRes || []).map((row) => ({
          dayOfWeek: Number(row.dayOfWeek),
          hour: Number(row.hour),
          minutes: Number(row.minutes || 0),
        })),
        aiAnalysis: aiAnalysis || null,
      };
    } catch (error) {
      // AI analizini getir (hata durumunda da deneyelim)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'time').catch(() => null);

      return {
        period,
        weeklyFocus: [],
        subjectDistribution: [],
        totals: {
          periodTotalMinutes: 0,
          dailyAverageMinutes: 0,
          longestSessionMinutes: 0,
          longestSessionType: null,
        },
        heatmap: [],
        aiAnalysis: aiAnalysis || null,
      };
    }
  }

  async getAnalysisExams(
    userId: string,
    range: 'week' | 'month' | 'all',
    examCode?: string,
  ) {
    const rangeInfo = this.buildRange(range);
    const period = this.buildRangeInfo(rangeInfo);

    try {
      let resolvedExamCode = await this.usersService.resolveExamCode(
        userId,
        examCode,
      );
      if (!resolvedExamCode) {
        const codeParams: any[] = [userId];
        let codeDateFilter = '';
        if (rangeInfo.start) {
          codeParams.push(rangeInfo.start, rangeInfo.endExclusive);
          codeDateFilter = 'AND exam_date >= $2 AND exam_date < $3';
        }

        const latestExam = await this.dataSource.query(
          `
          SELECT exam_code
          FROM mock_exams
          WHERE user_id = $1::uuid
          ${codeDateFilter}
          ORDER BY exam_date DESC
          LIMIT 1
        `,
          codeParams,
        );

        resolvedExamCode = latestExam[0]?.exam_code || null;
        if (!resolvedExamCode && rangeInfo.start) {
          const fallback = await this.dataSource.query(
            `
            SELECT exam_code
            FROM mock_exams
            WHERE user_id = $1::uuid
            ORDER BY exam_date DESC
            LIMIT 1
          `,
            [userId],
          );
          resolvedExamCode = fallback[0]?.exam_code || null;
        }
      }

      if (!resolvedExamCode) {
        return {
          period,
          examCode: null,
          averageNet: 0,
          targetNet: 0,
          remainingNet: 0,
          progressPercent: 0,
          trend: [],
          simulation: {
            estimatedRank: null,
            isEstimate: true,
            note: 'Henüz deneme verisi yok.',
          },
          subjectDetails: [],
        };
      }

      const examParams: any[] = [userId, resolvedExamCode];
      let examDateFilter = '';
      if (rangeInfo.start) {
        examParams.push(rangeInfo.start, rangeInfo.endExclusive);
        examDateFilter = 'AND exam_date >= $3 AND exam_date < $4';
      }

      const [averageRes, targetRes, trendRes] = await Promise.all([
        this.dataSource.query(
          `
          SELECT COALESCE(AVG(total_net), 0) AS average_net
          FROM mock_exams
          WHERE user_id = $1::uuid
            AND exam_code = $2
            ${examDateFilter}
        `,
          examParams,
        ),
        this.dataSource.query(
          `
          SELECT target_net
          FROM exam_target_goals
          WHERE user_id = $1::uuid
            AND exam_code = $2
          LIMIT 1
        `,
          [userId, resolvedExamCode],
        ),
        this.dataSource.query(
          `
          SELECT
            date_trunc('month', exam_date)::date AS period,
            COALESCE(AVG(total_net), 0) AS average_net
          FROM mock_exams
          WHERE user_id = $1::uuid
            AND exam_code = $2
            ${examDateFilter}
          GROUP BY period
          ORDER BY period
        `,
          examParams,
        ),
      ]);

      const averageNet = Number(averageRes[0]?.average_net || 0);
      const targetNet = Number(targetRes[0]?.target_net || 0);
      const remainingNet = targetNet > 0 ? Number((targetNet - averageNet).toFixed(2)) : 0;
      const progressPercent =
        targetNet > 0 ? Number(((averageNet / targetNet) * 100).toFixed(2)) : 0;

      const trend = (trendRes || []).map((row) => ({
        period: this.formatDateYmd(row.period),
        averageNet: Number(Number(row.average_net || 0).toFixed(2)),
      }));

      const simulationScore = averageNet > 0 ? Math.max(1000, Math.round(100000 - averageNet * 800)) : null;

      const subjectRes = await this.dataSource.query(
        `
        SELECT
          s.id AS "subjectId",
          s.name AS "subjectName",
          COALESCE(AVG(r.net), 0) AS "averageNet"
        FROM mock_exam_subject_results r
        INNER JOIN mock_exams me ON r.mock_exam_id = me.id
        INNER JOIN subjects s ON r.subject_id = s.id
        WHERE me.user_id = $1::uuid
          AND me.exam_code = $2
          ${examDateFilter.replace('exam_date', 'me.exam_date')}
        GROUP BY s.id, s.name
        ORDER BY "averageNet" DESC
      `,
        examParams,
      );

      const previousSubjectMap = new Map<string, number>();
      if (rangeInfo.previousStart) {
        const previousRes = await this.dataSource.query(
          `
          SELECT
            r.subject_id AS "subjectId",
            COALESCE(AVG(r.net), 0) AS "averageNet"
          FROM mock_exam_subject_results r
          INNER JOIN mock_exams me ON r.mock_exam_id = me.id
          WHERE me.user_id = $1::uuid
            AND me.exam_code = $2
            AND me.exam_date >= $3
            AND me.exam_date < $4
          GROUP BY r.subject_id
        `,
          [userId, resolvedExamCode, rangeInfo.previousStart, rangeInfo.previousEndExclusive],
        );

        previousRes.forEach((row) => {
          previousSubjectMap.set(row.subjectId, Number(row.averageNet || 0));
        });
      }

      const recentNetRes = await this.dataSource.query(
        `
        WITH ranked AS (
          SELECT
            r.subject_id AS "subjectId",
            s.name AS "subjectName",
            r.net AS net,
            me.exam_date AS "examDate",
            ROW_NUMBER() OVER (
              PARTITION BY r.subject_id
              ORDER BY me.exam_date DESC
            ) AS rn
          FROM mock_exam_subject_results r
          INNER JOIN mock_exams me ON r.mock_exam_id = me.id
          INNER JOIN subjects s ON r.subject_id = s.id
          WHERE me.user_id = $1::uuid
            AND me.exam_code = $2
            ${examDateFilter.replace('exam_date', 'me.exam_date')}
        )
        SELECT
          "subjectId",
          "subjectName",
          ARRAY_AGG(net ORDER BY "examDate") AS "recentNets"
        FROM ranked
        WHERE rn <= 6
        GROUP BY "subjectId", "subjectName"
      `,
        examParams,
      );

      const recentNetMap = new Map<string, number[]>();
      (recentNetRes || []).forEach((row) => {
        recentNetMap.set(
          row.subjectId,
          (row.recentNets || []).map((value: string) => Number(value)),
        );
      });

      const subjectDetails = (subjectRes || []).map((row) => {
        const averageNetValue = Number(row.averageNet || 0);
        const previousAverage = previousSubjectMap.get(row.subjectId) ?? 0;

        return {
          subjectId: row.subjectId,
          subjectName: row.subjectName,
          averageNet: Number(averageNetValue.toFixed(2)),
          previousAverageNet: Number(previousAverage.toFixed(2)),
          delta: Number((averageNetValue - previousAverage).toFixed(2)),
          recentNets: recentNetMap.get(row.subjectId) ?? [],
        };
      });

      // AI analizini getir (mockExams kategorisi)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'mockExams');

      return {
        period,
        examCode: resolvedExamCode,
        averageNet: Number(averageNet.toFixed(2)),
        targetNet,
        remainingNet,
        progressPercent,
        trend,
        simulation: {
          estimatedRank: simulationScore,
          isEstimate: true,
          note: simulationScore
            ? 'Geçmiş deneme performansına göre tahmini.'
            : 'Henüz deneme verisi yok.',
        },
        subjectDetails,
        aiAnalysis: aiAnalysis || null,
      };
    } catch (error) {
      // AI analizini getir (hata durumunda da deneyelim)
      const aiAnalysis = await this.getAiAnalysisForCategory(userId, range, 'mockExams').catch(() => null);

      return {
        period,
        examCode: examCode ?? null,
        averageNet: 0,
        targetNet: 0,
        remainingNet: 0,
        progressPercent: 0,
        trend: [],
        simulation: {
          estimatedRank: null,
          isEstimate: true,
          note: 'Henüz deneme verisi yok.',
        },
        subjectDetails: [],
        aiAnalysis: aiAnalysis || null,
      };
    }
  }
}
