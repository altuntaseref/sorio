import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamCodeToQuestionsQuizSessionsStudySessions1769300000000
  implements MigrationInterface
{
  name = 'AddExamCodeToQuestionsQuizSessionsStudySessions1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add exam_code to questions table
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN "exam_code" character varying(50) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_questions_exam_code" ON "questions" ("exam_code")
    `);

    // 2. Add exam_code to quiz_sessions table
    await queryRunner.query(`
      ALTER TABLE "quiz_sessions"
      ADD COLUMN "exam_code" character varying(50) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quiz_sessions_exam_code" ON "quiz_sessions" ("exam_code")
    `);

    // 3. Add exam_code to study_sessions table
    await queryRunner.query(`
      ALTER TABLE "study_sessions"
      ADD COLUMN "exam_code" character varying(50) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_study_sessions_exam_code" ON "study_sessions" ("exam_code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_study_sessions_exam_code"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_quiz_sessions_exam_code"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_questions_exam_code"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "study_sessions"
      DROP COLUMN IF EXISTS "exam_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "quiz_sessions"
      DROP COLUMN IF EXISTS "exam_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "questions"
      DROP COLUMN IF EXISTS "exam_code"
    `);
  }
}
