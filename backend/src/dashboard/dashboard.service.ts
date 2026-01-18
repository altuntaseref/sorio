import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MotivationService } from '../motivation/motivation.service';
import { UsersService } from '../users/users.service';
import { ExamsService } from '../exams/exams.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly motivationService: MotivationService,
    private readonly usersService: UsersService,
    private readonly examsService: ExamsService,
  ) {}

  async getDashboard(userId: string) {
    // Tüm veri kaynaklarını paralel çek
    const [
      overview,
      subjects,
      recentQuestions,
      weeklyActivity,
      motivation,
      quickStats,
      focusAnalysis,
      examSuccess,
      examCountdown,
    ] = await Promise.all([
      this.getOverview(userId),
      this.getSubjects(userId),
      this.getRecentQuestions(userId),
      this.getWeeklyActivity(userId),
      this.getMotivation(userId),
      this.getQuickStats(userId),
      this.getFocusAnalysis(userId),
      this.getExamSuccess(userId),
      this.getExamCountdown(userId),
    ]);

    return {
      overview,
      subjects,
      recentQuestions,
      weeklyActivity,
      motivation,
      quickStats,
      focusAnalysis,
      examSuccess,
      examCountdown,
    };
  }

  /**
   * 7. ODAKLANMA ANALİZİ (Toplam süre, haftalık değişim, en verimli saat, dağılım)
   */
  private async getFocusAnalysis(userId: string) {
    try {
      // Toplam odaklanma (dakika)
      const totalRes = await this.dataSource.query(
        `
        SELECT
          COALESCE(SUM(duration), 0)::int AS total_minutes
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
        `,
        [userId],
      );

      // Bu hafta ve geçen hafta odaklanma (dakika)
      const weeklyRes = await this.dataSource.query(
        `
        WITH this_week AS (
          SELECT COALESCE(SUM(duration), 0)::int AS minutes
          FROM study_sessions
          WHERE user_id = $1::uuid
            AND status = 'COMPLETED'
            AND started_at >= CURRENT_DATE - INTERVAL '6 days'
        ),
        last_week AS (
          SELECT COALESCE(SUM(duration), 0)::int AS minutes
          FROM study_sessions
          WHERE user_id = $1::uuid
            AND status = 'COMPLETED'
            AND started_at >= CURRENT_DATE - INTERVAL '13 days'
            AND started_at <  CURRENT_DATE - INTERVAL '6 days'
        )
        SELECT this_week.minutes  AS this_week,
               last_week.minutes  AS last_week
        FROM this_week, last_week
        `,
        [userId],
      );

      const totalMinutes = Number(totalRes[0]?.total_minutes || 0);
      const thisWeek = Number(weeklyRes[0]?.this_week || 0);
      const lastWeek = Number(weeklyRes[0]?.last_week || 0);
      const weeklyDelta =
        lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Number((((thisWeek - lastWeek) / lastWeek) * 100).toFixed(2));

      // En verimli saat (son 30 gün)
      const productiveRes = await this.dataSource.query(
        `
        SELECT
          EXTRACT(HOUR FROM started_at)::int AS hour,
          SUM(duration)::int AS total_minutes
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
          AND started_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY hour
        ORDER BY total_minutes DESC
        LIMIT 1
        `,
        [userId],
      );

      const productiveHour = productiveRes[0]
        ? {
            from: Number(productiveRes[0].hour),
            to: (Number(productiveRes[0].hour) + 1) % 24,
          }
        : null;

      // Pomodoro vs Free timer dağılımı (son 30 gün)
      const distRes = await this.dataSource.query(
        `
        SELECT
          timer_type,
          COALESCE(SUM(duration), 0)::int AS minutes
        FROM study_sessions
        WHERE user_id = $1::uuid
          AND status = 'COMPLETED'
          AND started_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY timer_type
        `,
        [userId],
      );

      const distribution = distRes.map((r) => ({
        type: r.timer_type,
        minutes: Number(r.minutes || 0),
      }));

      return {
        totalMinutes,
        weeklyDelta,
        productiveHour,
        distribution,
      };
    } catch (error) {
      console.error('Focus analysis fetch error:', error);
      return {
        totalMinutes: 0,
        weeklyDelta: 0,
        productiveHour: null,
        distribution: [],
      };
    }
  }

  /**
   * 8. SINAV BAŞARISI (Deneme sınavları ve hedef net)
   */
  private async getExamSuccess(userId: string) {
    try {
      // Son deneme ve önceki deneme (aynı exam_code)
      const lastRes = await this.dataSource.query(
        `
        SELECT id, exam_code, exam_name, exam_date, total_net
        FROM mock_exams
        WHERE user_id = $1::uuid
        ORDER BY exam_date DESC
        LIMIT 2
        `,
        [userId],
      );

      const lastExam = lastRes[0] || null;
      const prevExam = lastRes[1] || null;
      const examCode = lastExam?.exam_code || null;

      // Hedef net
      let targetNet = 0;
      if (examCode) {
        const goalRes = await this.dataSource.query(
          `
          SELECT target_net
          FROM exam_target_goals
          WHERE user_id = $1::uuid
            AND exam_code = $2
          LIMIT 1
          `,
          [userId, examCode],
        );
        targetNet = Number(goalRes[0]?.target_net || 0);
      }

      const currentNet = lastExam ? Number(lastExam.total_net || 0) : 0;
      const previousNet = prevExam ? Number(prevExam.total_net || 0) : 0;
      const delta = Number((currentNet - previousNet).toFixed(2));
      const progressPercent = targetNet > 0 ? Number(((currentNet / targetNet) * 100).toFixed(2)) : 0;
      const remainingNet = targetNet > 0 ? Number((targetNet - currentNet).toFixed(2)) : 0;

      return {
        examCode,
        currentNet,
        previousNet,
        delta, // Net Ort. artışı/azalışı
        targetNet,
        remainingNet,
        progressPercent,
        lastExam: lastExam
          ? {
              examName: lastExam.exam_name,
              examDate: lastExam.exam_date,
            }
          : null,
      };
    } catch (error) {
      console.error('Exam success fetch error:', error);
      return {
        examCode: null,
        currentNet: 0,
        previousNet: 0,
        delta: 0,
        targetNet: 0,
        remainingNet: 0,
        progressPercent: 0,
        lastExam: null,
      };
    }
  }

  // 1. GENEL İSTATİSTİKLER
  private async getOverview(userId: string) {
    try {
      const result = await this.dataSource.query(
        `
        SELECT 
          -- 1. Eklenen toplam soru
          (SELECT COUNT(*)::int FROM questions WHERE user_id = $1::uuid) as "totalQuestionsAdded",
          
          -- 2. Quiz'de çözülen toplam soru sayısı (unique)
          (SELECT COUNT(DISTINCT qa.question_id)::int 
           FROM quiz_answers qa
           INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
           WHERE qs.user_id = $1::uuid) as "totalQuestionsSolved",
          
          -- 3. Toplam doğru cevaplar
          (SELECT COUNT(*)::int 
           FROM quiz_answers qa
           INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
           WHERE qs.user_id = $1::uuid AND qa.is_correct = true) as "totalCorrect",
           
          -- 4. Toplam yanlış cevaplar
          (SELECT COUNT(*)::int 
           FROM quiz_answers qa
           INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
           WHERE qs.user_id = $1::uuid AND qa.is_correct = false) as "totalIncorrect",
          
          -- 5. Bu hafta eklenen sorular
          (SELECT COUNT(*)::int 
           FROM questions 
           WHERE user_id = $1::uuid 
           AND created_at >= CURRENT_DATE - INTERVAL '7 days') as "weeklyQuestionsAdded"
      `,
        [userId],
      );

      const totalCorrect = Number(result[0]?.totalCorrect || 0);
      const totalIncorrect = Number(result[0]?.totalIncorrect || 0);
      const totalAttempts = totalCorrect + totalIncorrect;

      const successRate =
        totalAttempts > 0
          ? Number(((totalCorrect / totalAttempts) * 100).toFixed(2))
          : 0;

      // Basit streak hesaplama
      let studyStreak = 0;
      try {
        const streakResult = await this.dataSource.query(
          `
          WITH daily_logins AS (
            SELECT DISTINCT DATE(created_at) as login_date
            FROM login_logs
            WHERE user_id = $1::uuid
            ORDER BY login_date DESC
          )
          SELECT COUNT(*) as streak
          FROM (
            SELECT 
              login_date,
              login_date - ROW_NUMBER() OVER (ORDER BY login_date DESC) * INTERVAL '1 day' as grp
            FROM daily_logins
          ) sub
          WHERE grp = (
            SELECT login_date - ROW_NUMBER() OVER (ORDER BY login_date DESC) * INTERVAL '1 day'
            FROM daily_logins
            LIMIT 1
          )
          `,
          [userId],
        );
        studyStreak = parseInt(streakResult[0]?.streak || '0', 10);
      } catch (streakError) {
        // Streak hesaplanamadıysa 0 olarak devam et
        studyStreak = 0;
      }

      const overview = {
        totalQuestionsAdded: Number(result[0]?.totalQuestionsAdded || 0),
        totalQuestionsSolved: Number(result[0]?.totalQuestionsSolved || 0),
        successRate,
        weeklyQuestionsAdded: Number(result[0]?.weeklyQuestionsAdded || 0),
        studyStreak,
      };

      return overview;
    } catch (error) {
      console.error('❌ Overview fetch error:', error);
      return {
        totalQuestionsAdded: 0,
        totalQuestionsSolved: 0,
        successRate: 0,
        weeklyQuestionsAdded: 0,
        studyStreak: 0,
      };
    }
  }

  // 2. DERS BAZLI DETAYLAR
  private async getSubjects(userId: string) {
    try {
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
      ];

      const result = await this.dataSource.query(
        `
        SELECT 
          s.id as "subjectId",
          s.name as "subjectName",
          
          -- Eklenen soru sayısı
          COUNT(DISTINCT q.id) as "totalQuestions",
          
          -- Çözülen soru sayısı (quiz_answers'dan)
          COUNT(DISTINCT CASE 
            WHEN qa.id IS NOT NULL THEN q.id 
          END) as "questionsSolved",
          
          -- Doğru ve yanlış sayıları (quiz_answers'dan)
          COALESCE(SUM(CASE WHEN qa.is_correct = true THEN 1 ELSE 0 END), 0) as "correctCount",
          COALESCE(SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END), 0) as "incorrectCount",
          
          -- Mastered sorular (question_statistics'ten: mastery_level >= 3)
          COUNT(DISTINCT CASE 
            WHEN qs.mastery_level >= 3
            THEN qs.question_id 
          END) as "masteredCount"
          
        FROM subjects s
        INNER JOIN questions q ON s.id = q.subject_id AND q.user_id = $1::uuid
        LEFT JOIN quiz_answers qa ON q.id = qa.question_id
        LEFT JOIN quiz_sessions qsess ON qa.quiz_session_id = qsess.id AND qsess.user_id = $1::uuid
        LEFT JOIN question_statistics qs ON q.id = qs.question_id AND qs.user_id = $1::uuid
        GROUP BY s.id, s.name
        ORDER BY "totalQuestions" DESC
      `,
        [userId],
      );

      return result.map((row, index) => {
        const correctCount = Number(row.correctCount);
        const incorrectCount = Number(row.incorrectCount);
        const totalAttempts = correctCount + incorrectCount;

        return {
          subjectId: row.subjectId,
          subjectName: row.subjectName,
          color: colors[index % colors.length],
          totalQuestions: Number(row.totalQuestions),
          questionsSolved: Number(row.questionsSolved),
          correctCount,
          incorrectCount,
          accuracy:
            totalAttempts > 0
              ? Number(((correctCount / totalAttempts) * 100).toFixed(2))
              : 0,
          masteredCount: Number(row.masteredCount),
        };
      });
    } catch (error) {
      console.error('Subjects fetch error:', error);
      return [];
    }
  }

  // 3. SON EKLENEN SORULAR
  private async getRecentQuestions(userId: string) {
    try {
      const result = await this.dataSource.query(
        `
        SELECT 
          q.id,
          q.name,
          q.question_image_url as "questionImageUrl",
          s.name as "subjectName",
          t.name as "topicName",
          q.created_at as "createdAt",
          q."correctAnswer" as "correctAnswer",
          
          -- Badge bilgileri (question_statistics'ten)
          COALESCE(qs.correct_count, 0) as correct_count,
          COALESCE(qs.incorrect_count, 0) as incorrect_count,
          COALESCE(qs.mastery_level, 0) as mastery_level
          
        FROM questions q
        INNER JOIN subjects s ON q.subject_id = s.id
        LEFT JOIN topics t ON q.topic_id = t.id
        LEFT JOIN question_statistics qs ON q.id = qs.question_id AND qs.user_id = q.user_id
        WHERE q.user_id = $1::uuid
        ORDER BY q.created_at DESC
        LIMIT 10
      `,
        [userId],
      );

      return result.map((row) => ({
        id: row.id,
        name: row.name,
        questionImageUrl: row.questionImageUrl,
        subjectName: row.subjectName,
        topicName: row.topicName,
        createdAt: row.createdAt,
        correctAnswer: row.correctAnswer,
        badges: {
          isMastered: Number(row.mastery_level) >= 3,
          hasNoErrors: Number(row.incorrect_count) === 0,
        },
      }));
    } catch (error) {
      console.error('Recent questions fetch error:', error);
      return [];
    }
  }

  // 4. HAFTALIK AKTİVİTE
  private async getWeeklyActivity(userId: string) {
    try {
      const result = await this.dataSource.query(
        `
        WITH last_7_days AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date as date
        ),
        questions_added AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM questions
          WHERE user_id = $1::uuid
          AND created_at >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY DATE(created_at)
        ),
        questions_solved AS (
          SELECT 
            DATE(qa.answered_at) as date,
            COUNT(DISTINCT qa.question_id) as count
          FROM quiz_answers qa
          INNER JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
          WHERE qs.user_id = $1::uuid
          AND qa.answered_at >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY DATE(qa.answered_at)
        )
        SELECT 
          ld.date,
          COALESCE(qa.count, 0) as "questionsAdded",
          COALESCE(qs.count, 0) as "questionsSolved"
        FROM last_7_days ld
        LEFT JOIN questions_added qa ON ld.date = qa.date
        LEFT JOIN questions_solved qs ON ld.date = qs.date
        ORDER BY ld.date
      `,
        [userId],
      );

      return result.map((row) => ({
        date: row.date.toISOString().split('T')[0],
        questionsAdded: Number(row.questionsAdded),
        questionsSolved: Number(row.questionsSolved),
      }));
    } catch (error) {
      console.error('Weekly activity fetch error:', error);
      return [];
    }
  }

  // 5. MOTİVASYON MESAJI
  private async getMotivation(userId: string) {
    try {
      return await this.motivationService.getMotivationForUser(userId);
    } catch (error) {
      console.error('Motivation fetch error:', error);
      return {
        title: 'Başarıya Giden Yoldasın! 🚀',
        message: 'Her gün biraz daha ilerliyorsun!',
        type: 'general',
      };
    }
  }

  // 6. HIZLI ERİŞİM BİLGİLERİ
  private async getQuickStats(userId: string) {
    try {
      // Pending reviews: next_review_at <= NOW() veya mastery_level < 2 olan sorular
      const pendingResult = await this.dataSource.query(
        `
        SELECT COUNT(DISTINCT question_id)::int as count
        FROM question_statistics
        WHERE user_id = $1::uuid
        AND (
          (next_review_at IS NULL OR next_review_at <= NOW())
          OR mastery_level < 2
        )
      `,
        [userId],
      );

      // Zayıf dersler: Başarı oranı %50'nin altında olanlar
      const weakSubjectsResult = await this.dataSource.query(
        `
        SELECT s.name
        FROM subjects s
        INNER JOIN questions q ON s.id = q.subject_id
        LEFT JOIN quiz_answers qa ON q.id = qa.question_id
        LEFT JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id AND qs.user_id = $1::uuid
        WHERE q.user_id = $1::uuid
        GROUP BY s.id, s.name
        HAVING 
          COUNT(qa.id) > 5
          AND (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(qa.id), 0)) < 0.5
        LIMIT 3
      `,
        [userId],
      );

      // Sonraki hedef hesapla
      const totalQuestions = await this.dataSource.query(
        `SELECT COUNT(*)::int as count FROM questions WHERE user_id = $1::uuid`,
        [userId],
      );
      const count = Number(totalQuestions[0]?.count || 0);
      let nextGoal = '10 soru ekle';
      if (count >= 10) nextGoal = '50 soru ekle';
      if (count >= 50) nextGoal = '100 soru ekle';
      if (count >= 100) nextGoal = '250 soru ekle';
      if (count >= 250) nextGoal = '500 soru ekle';
      if (count >= 500) nextGoal = '1000 soru hedefine ulaş';

      return {
        pendingReviews: Number(pendingResult[0]?.count || 0),
        weakSubjects: weakSubjectsResult.map((r) => r.name),
        nextGoal,
      };
    } catch (error) {
      console.error('Quick stats fetch error:', error);
      return {
        pendingReviews: 0,
        weakSubjects: [],
        nextGoal: '10 soru ekle',
      };
    }
  }

  /**
   * 9. SINAVA KALAN GÜN SAYISI
   */
  private async getExamCountdown(userId: string) {
    try {
      // Kullanıcının examTarget'ını al
      const user = await this.usersService.findOne(userId);
      if (!user || !user.examTarget) {
        return {
          daysRemaining: null,
          examDate: null,
          examName: null,
          examCode: null,
        };
      }

      // Sınav bilgisini al
      const exam = await this.examsService.findOneByCode(user.examTarget);
      if (!exam || !exam.examDate) {
        return {
          daysRemaining: null,
          examDate: null,
          examName: exam?.name || null,
          examCode: user.examTarget,
        };
      }

      // Kaç gün kaldığını hesapla
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Sadece tarih karşılaştırması için saat bilgisini sıfırla
      
      const examDate = new Date(exam.examDate);
      examDate.setHours(0, 0, 0, 0);

      const diffTime = examDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        daysRemaining: daysRemaining >= 0 ? daysRemaining : null, // Geçmiş tarihler için null
        examDate: exam.examDate.toISOString().split('T')[0], // YYYY-MM-DD formatında
        examName: exam.name,
        examCode: exam.code,
      };
    } catch (error) {
      console.error('Exam countdown fetch error:', error);
      return {
        daysRemaining: null,
        examDate: null,
        examName: null,
        examCode: null,
      };
    }
  }
}
