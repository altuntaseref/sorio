import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSummaryAndCategoriesToUserAnalyses1770300000000 implements MigrationInterface {
  name = 'AddSummaryAndCategoriesToUserAnalyses1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_analyses"
      ADD COLUMN IF NOT EXISTS "summary" text,
      ADD COLUMN IF NOT EXISTS "categories" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_analyses"
      DROP COLUMN IF EXISTS "categories",
      DROP COLUMN IF EXISTS "summary"
    `);
  }
}
