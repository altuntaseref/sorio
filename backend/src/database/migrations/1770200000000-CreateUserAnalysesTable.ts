import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAnalysesTable1770200000000 implements MigrationInterface {
  name = 'CreateUserAnalysesTable1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_analyses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "week_start" date NOT NULL,
        "week_end" date NOT NULL,
        "analysis_text" text NOT NULL,
        "r2_key" character varying,
        "r2_url" text,
        "data_summary" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_user_analyses_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_analyses_user_week" UNIQUE ("user_id", "week_start")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_analyses_user_id" ON "user_analyses" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_analyses"
      ADD CONSTRAINT "FK_user_analyses_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_analyses" DROP CONSTRAINT IF EXISTS "FK_user_analyses_user"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_analyses_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_analyses"
    `);
  }
}
