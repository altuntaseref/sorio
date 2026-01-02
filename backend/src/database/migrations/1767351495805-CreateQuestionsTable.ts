import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuestionsTable1767351495805 implements MigrationInterface {
    name = 'CreateQuestionsTable1767351495805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "subject_id" uuid NOT NULL, "topic_id" uuid NOT NULL, "name" character varying(200), "question_image_url" text NOT NULL, "correct_answer" character(1) NOT NULL, "solution_note" text, "solution_image_url" text, "ai_solution" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "CHK_correct_answer" CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E'))`);
        await queryRunner.query(`CREATE INDEX "IDX_5800cd25a5888174b2c40e67d4" ON "questions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_03d214f92d9f3788afa3d6c6cb" ON "questions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_42ee15f944968a00b8843e186a" ON "questions" ("subject_id", "topic_id") `);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_bab312bafb550a655ece4bca116" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_bab312bafb550a655ece4bca116"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "CHK_correct_answer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42ee15f944968a00b8843e186a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03d214f92d9f3788afa3d6c6cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5800cd25a5888174b2c40e67d4"`);
        await queryRunner.query(`DROP TABLE "questions"`);
    }

}
