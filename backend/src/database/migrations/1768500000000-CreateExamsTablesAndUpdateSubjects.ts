import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamsTablesAndUpdateSubjects1768500000000
  implements MigrationInterface
{
  name = 'CreateExamsTablesAndUpdateSubjects1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create exams table
    await queryRunner.query(`
      CREATE TABLE "exams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(200) NOT NULL,
        "short_name" character varying(50) NOT NULL,
        "level" character varying(20) NOT NULL,
        "incorrect_to_nullify" integer NOT NULL DEFAULT 4,
        "order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_exams_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exams_code" UNIQUE ("code"),
        CONSTRAINT "CHK_exams_level" CHECK ("level" IN ('HIGH_SCHOOL', 'UNIVERSITY', 'PUBLIC_SECTOR', 'ACADEMIC'))
      )
    `);

    // 2. Create exam_sections table
    await queryRunner.query(`
      CREATE TABLE "exam_sections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_id" uuid NOT NULL,
        "key" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "question_count" integer NOT NULL DEFAULT 0,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_exam_sections_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exam_sections_exam_key" UNIQUE ("exam_id", "key")
      )
    `);

    // 3. Add foreign key from exam_sections to exams
    await queryRunner.query(`
      ALTER TABLE "exam_sections" 
      ADD CONSTRAINT "FK_exam_sections_exam_id" 
      FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE
    `);

    // 4. Add exam_code column to subjects table
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN "exam_code" character varying(50)
    `);

    // 5. Add section_key column to subjects table
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN "section_key" character varying(50)
    `);

    // 6. Update check constraint for subjects (sistem dersleri için exam_code zorunlu)
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      DROP CONSTRAINT IF EXISTS "CHK_subject_logic"
    `);

    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD CONSTRAINT "CHK_subject_logic" 
      CHECK (
        (is_system = true AND user_id IS NULL AND exam_code IS NOT NULL) OR 
        (is_system = false AND user_id IS NOT NULL AND exam_code IS NULL)
      )
    `);

    // 7. Update unique index for system subjects (exam_code + name)
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_unique_system_subject_name"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_unique_system_subject_exam_name" 
      ON "subjects" ("exam_code", "name") 
      WHERE "is_system" = true AND "exam_code" IS NOT NULL
    `);

    // 8. Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_exams_code" ON "exams" ("code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_exam_sections_exam_id" ON "exam_sections" ("exam_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subjects_exam_code" ON "subjects" ("exam_code") 
      WHERE "exam_code" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subjects_section_key" ON "subjects" ("section_key") 
      WHERE "section_key" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subjects_section_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subjects_exam_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_sections_exam_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exams_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_unique_system_subject_exam_name"`);

    // Restore old unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_unique_system_subject_name" 
      ON "subjects" ("exam_target", "name") 
      WHERE "is_system" = true
    `);

    // Restore old check constraint
    await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "CHK_subject_logic"`);
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD CONSTRAINT "CHK_subject_logic" 
      CHECK (
        (is_system = true AND user_id IS NULL AND exam_target IS NOT NULL) OR 
        (is_system = false AND user_id IS NOT NULL AND exam_target IS NULL)
      )
    `);

    // Drop columns from subjects
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "section_key"`);
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "exam_code"`);

    // Drop foreign key and tables
    await queryRunner.query(`ALTER TABLE "exam_sections" DROP CONSTRAINT IF EXISTS "FK_exam_sections_exam_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exams"`);
  }
}
