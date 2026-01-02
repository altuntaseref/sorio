import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTopicsTable1767347384320 implements MigrationInterface {
    name = 'CreateTopicsTable1767347384320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "topics"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_topics_subject_id"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "FK_subjects_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_unique_user_subject_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_unique_system_subject_name"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "CHK_subject_logic"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "UQ_topics_subject_id_name"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "topics" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "login_logs" DROP CONSTRAINT "FK_e2dffa109d0d3dbd94a0a51669c"`);
        await queryRunner.query(`ALTER TABLE "login_logs" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "topics" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "topics" ALTER COLUMN "subject_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "login_logs" ADD CONSTRAINT "FK_e2dffa109d0d3dbd94a0a51669c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_002c0d43b06fcd693cd4b3da5cb" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD CONSTRAINT "FK_67397d15535aa2d1068650cbdb8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "FK_67397d15535aa2d1068650cbdb8"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_002c0d43b06fcd693cd4b3da5cb"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "login_logs" DROP CONSTRAINT "FK_e2dffa109d0d3dbd94a0a51669c"`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "topics" ALTER COLUMN "subject_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "topics" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token")`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "login_logs" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "login_logs" ADD CONSTRAINT "FK_e2dffa109d0d3dbd94a0a51669c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "topics" ADD "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "UQ_topics_subject_id_name" UNIQUE ("subject_id", "name")`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD CONSTRAINT "CHK_subject_logic" CHECK ((((is_system = true) AND (user_id IS NULL) AND (exam_target IS NOT NULL)) OR ((is_system = false) AND (user_id IS NOT NULL) AND (exam_target IS NULL))))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_system_subject_name" ON "subjects" ("name", "exam_target") WHERE (is_system = true)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_user_subject_name" ON "subjects" ("user_id", "name") WHERE ((user_id IS NOT NULL) AND (is_system = false))`);
        await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "subjects" ADD CONSTRAINT "FK_subjects_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_topics_subject_id" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
