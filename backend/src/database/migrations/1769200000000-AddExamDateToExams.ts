import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamDateToExams1769200000000 implements MigrationInterface {
  name = 'AddExamDateToExams1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exams"
      ADD COLUMN "exam_date" DATE NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exams"
      DROP COLUMN "exam_date"
    `);
  }
}
