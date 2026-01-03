import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getAnalyticsOverview(userId: string) {
    await this.dataSource.query('REFRESH MATERIALIZED VIEW weekly_activity');

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
    );

    const totalQuestionsAddedQuery = this.dataSource.query(
      `
      SELECT
        COUNT(*) AS "totalQuestionsAdded"
      FROM questions
      WHERE user_id = $1
    `,
      [userId],
    );

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
    );

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
    );

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

    const totalStats = totalStatsResult[0];
    const totalQuestionsAdded = totalQuestionsAddedResult[0].totalQuestionsAdded;

    const overallAccuracy =
      totalStats.totalQuestionsSolved > 0
        ? parseFloat(
            ((totalStats.totalCorrect / totalStats.totalQuestionsSolved) * 100).toFixed(2),
          )
        : 0;

    let recordWeekQuestionsSolved = 0;
    if (weeklyActivityResult.length > 0) {
      recordWeekQuestionsSolved = Math.max(
        ...weeklyActivityResult.map(w => w.questionsSolved),
      );
    }

    const weeklyActivity = weeklyActivityResult.map(w => ({
      ...w,
      week: new Date(w.week).toISOString().split('T')[0], // Format as YYYY-MM-DD
      isRecordWeek:
        w.questionsSolved === recordWeekQuestionsSolved &&
        recordWeekQuestionsSolved > 0,
    }));

    const subjectBreakdown = subjectBreakdownResult.map(s => ({
      ...s,
      accuracy:
        s.questionsSolved > 0
          ? parseFloat(((s.correctCount / s.questionsSolved) * 100).toFixed(2))
          : 0,
    }));

    return {
      totalQuestionsSolved: Number(totalStats.totalQuestionsSolved),
      totalCorrect: Number(totalStats.totalCorrect),
      totalIncorrect: Number(totalStats.totalIncorrect),
      overallAccuracy,
      totalQuestionsAdded: Number(totalQuestionsAdded),
      weeklyActivity,
      subjectBreakdown,
    };
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
    await this.dataSource.query('REFRESH MATERIALIZED VIEW weekly_activity');

    const weeklyActivityRaw: any[] = await this.dataSource.query(
      'SELECT * FROM weekly_activity WHERE user_id = $1 ORDER BY week_start DESC LIMIT $2',
      [userId, weeks],
    );

    if (!weeklyActivityRaw.length) {
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
  }

  async getSubjectStatistics(userId: string) {
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

    const subjectStatsRaw = await this.dataSource.query(query, [userId]);

    const subjects = subjectStatsRaw.map(s => {
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
  }
}
