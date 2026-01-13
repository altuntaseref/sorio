import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimerTypeToStudySessions1768300000000
  implements MigrationInterface
{
  name = 'AddTimerTypeToStudySessions1768300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // study_sessions tablosuna timer_type kolonu ekle
    const studySessionsTable = await queryRunner.getTable('study_sessions');
    if (studySessionsTable) {
      const timerTypeColumn = studySessionsTable.findColumnByName('timer_type');
      if (!timerTypeColumn) {
        await queryRunner.query(`
          ALTER TABLE "study_sessions" 
          ADD COLUMN "timer_type" VARCHAR(20) NOT NULL DEFAULT 'POMODORO'
        `);

        // CHECK constraint ekle
        const timerTypeCheckConstraint = await queryRunner.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'study_sessions' 
          AND constraint_name = 'check_study_sessions_timer_type'
        `);

        if (timerTypeCheckConstraint.length === 0) {
          await queryRunner.query(`
            ALTER TABLE "study_sessions" 
            ADD CONSTRAINT "check_study_sessions_timer_type" 
            CHECK (timer_type IN ('POMODORO', 'FREE_TIMER'))
          `);
        }

        // Index ekle (timer_type ile filtreleme için)
        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS "IDX_study_sessions_timer_type" 
          ON "study_sessions" ("timer_type")
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Constraint'i kaldır
    await queryRunner.query(`
      ALTER TABLE "study_sessions" 
      DROP CONSTRAINT IF EXISTS "check_study_sessions_timer_type"
    `);

    // Index'i kaldır
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_study_sessions_timer_type"
    `);

    // Kolonu kaldır
    await queryRunner.query(`
      ALTER TABLE "study_sessions" 
      DROP COLUMN IF EXISTS "timer_type"
    `);
  }
}
