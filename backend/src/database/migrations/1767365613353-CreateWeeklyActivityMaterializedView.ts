import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeeklyActivityMaterializedView1767365613353 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW weekly_activity AS
      SELECT
        user_id,
        DATE_TRUNC('week', date) AS week_start,
        SUM(questions_solved) AS total_solved,
        SUM(correct_count) AS total_correct,
        SUM(incorrect_count) AS total_incorrect
      FROM daily_statistics
      GROUP BY user_id, week_start;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX weekly_activity_user_week_start_idx ON weekly_activity (user_id, week_start);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP MATERIALIZED VIEW weekly_activity');
  }
}
