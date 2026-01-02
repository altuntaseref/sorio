import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubjectsAndTopicsTables1704184558839 implements MigrationInterface {
    name = 'CreateSubjectsAndTopicsTables1704184558839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create subjects table
        await queryRunner.query(`
            CREATE TABLE "subjects" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "name" character varying(100) NOT NULL,
                "exam_target" character varying(50),
                "is_system" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_subjects_id" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key from subjects to users
        await queryRunner.query(`
            ALTER TABLE "subjects" ADD CONSTRAINT "FK_subjects_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // Add the complex check constraint for unified subject logic
        await queryRunner.query(`
            ALTER TABLE "subjects" ADD CONSTRAINT "CHK_subject_logic" 
            CHECK (
                (is_system = true AND user_id IS NULL AND exam_target IS NOT NULL) OR 
                (is_system = false AND user_id IS NOT NULL AND exam_target IS NULL)
            )
        `);

        // Add partial unique index for user-defined subjects
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_unique_user_subject_name" 
            ON "subjects" ("user_id", "name") 
            WHERE "user_id" IS NOT NULL AND is_system = false
        `);

        // Add partial unique index for system subjects
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_unique_system_subject_name" 
            ON "subjects" ("exam_target", "name") 
            WHERE "is_system" = true
        `);

        // Create topics table
        await queryRunner.query(`
            CREATE TABLE "topics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "subject_id" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_topics_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_topics_subject_id_name" UNIQUE ("subject_id", "name")
            )
        `);

        // Add foreign key from topics to subjects
        await queryRunner.query(`
            ALTER TABLE "topics" ADD CONSTRAINT "FK_topics_subject_id" 
            FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints and tables in reverse order of creation
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_topics_subject_id"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP INDEX "IDX_unique_system_subject_name"`);
        await queryRunner.query(`DROP INDEX "IDX_unique_user_subject_name"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "CHK_subject_logic"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "FK_subjects_user_id"`);
        await queryRunner.query(`DROP TABLE "subjects"`);
    }

}
