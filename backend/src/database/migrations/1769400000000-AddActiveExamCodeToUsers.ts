import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveExamCodeToUsers1769400000000 implements MigrationInterface {
  name = 'AddActiveExamCodeToUsers1769400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "active_exam_code" character varying(50) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_active_exam_code" ON "users" ("active_exam_code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_active_exam_code"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "active_exam_code"
    `);
  }
}
