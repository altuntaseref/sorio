import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMockExamTables1768600000000 implements MigrationInterface {
  name = 'CreateMockExamTables1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create user_exam_targets table
    await queryRunner.query(`
      CREATE TABLE "user_exam_targets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "exam_code" character varying(50) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_user_exam_targets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_exam_targets_user_exam" UNIQUE ("user_id", "exam_code")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_exam_targets" 
      ADD CONSTRAINT "FK_user_exam_targets_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // 2. Create exam_target_goals table
    await queryRunner.query(`
      CREATE TABLE "exam_target_goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "exam_code" character varying(50) NOT NULL,
        "target_net" decimal(5,2) NOT NULL CHECK (target_net >= 0),
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_exam_target_goals_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exam_target_goals_user_exam" UNIQUE ("user_id", "exam_code")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_target_goals" 
      ADD CONSTRAINT "FK_exam_target_goals_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // 3. Create mock_exams table
    await queryRunner.query(`
      CREATE TABLE "mock_exams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "exam_code" character varying(50) NOT NULL,
        "exam_name" character varying(200) NOT NULL,
        "exam_date" date NOT NULL,
        "total_correct" integer NOT NULL DEFAULT 0,
        "total_wrong" integer NOT NULL DEFAULT 0,
        "total_empty" integer NOT NULL DEFAULT 0,
        "total_net" decimal(5,2) NOT NULL,
        "is_record" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_mock_exams_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "mock_exams" 
      ADD CONSTRAINT "FK_mock_exams_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // 4. Create mock_exam_subject_results table
    await queryRunner.query(`
      CREATE TABLE "mock_exam_subject_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mock_exam_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "correct_count" integer NOT NULL DEFAULT 0,
        "wrong_count" integer NOT NULL DEFAULT 0,
        "empty_count" integer NOT NULL DEFAULT 0,
        "net" decimal(5,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_mock_exam_subject_results_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_mock_exam_subject_results_exam_subject" UNIQUE ("mock_exam_id", "subject_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "mock_exam_subject_results" 
      ADD CONSTRAINT "FK_mock_exam_subject_results_mock_exam" 
      FOREIGN KEY ("mock_exam_id") REFERENCES "mock_exams"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "mock_exam_subject_results" 
      ADD CONSTRAINT "FK_mock_exam_subject_results_subject" 
      FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE
    `);

    // 5. Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_exam_targets_user_id" ON "user_exam_targets" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exam_target_goals_user_id" ON "exam_target_goals" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exam_target_goals_exam_code" ON "exam_target_goals" ("exam_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mock_exams_user_id" ON "mock_exams" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mock_exams_exam_code" ON "mock_exams" ("exam_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mock_exams_exam_date" ON "mock_exams" ("exam_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mock_exams_user_exam_code" ON "mock_exams" ("user_id", "exam_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mock_exam_subject_results_mock_exam_id" ON "mock_exam_subject_results" ("mock_exam_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mock_exam_subject_results_subject_id" ON "mock_exam_subject_results" ("subject_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mock_exam_subject_results_subject_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mock_exam_subject_results_mock_exam_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mock_exams_user_exam_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mock_exams_exam_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mock_exams_exam_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mock_exams_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_target_goals_exam_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_target_goals_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_exam_targets_user_id"`);

    // Drop foreign keys and tables
    await queryRunner.query(`ALTER TABLE "mock_exam_subject_results" DROP CONSTRAINT IF EXISTS "FK_mock_exam_subject_results_subject"`);
    await queryRunner.query(`ALTER TABLE "mock_exam_subject_results" DROP CONSTRAINT IF EXISTS "FK_mock_exam_subject_results_mock_exam"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mock_exam_subject_results"`);

    await queryRunner.query(`ALTER TABLE "mock_exams" DROP CONSTRAINT IF EXISTS "FK_mock_exams_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mock_exams"`);

    await queryRunner.query(`ALTER TABLE "exam_target_goals" DROP CONSTRAINT IF EXISTS "FK_exam_target_goals_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_target_goals"`);

    await queryRunner.query(`ALTER TABLE "user_exam_targets" DROP CONSTRAINT IF EXISTS "FK_user_exam_targets_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_exam_targets"`);
  }
}
