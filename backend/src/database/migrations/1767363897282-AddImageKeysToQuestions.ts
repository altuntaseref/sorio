import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageKeysToQuestions1767363897282 implements MigrationInterface {
    name = 'AddImageKeysToQuestions1767363897282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_0043a6d098341fa415351eaf28a"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_bab312bafb550a655ece4bca116"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5800cd25a5888174b2c40e67d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03d214f92d9f3788afa3d6c6cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42ee15f944968a00b8843e186a"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "CHK_correct_answer"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "correct_answer"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "solution_note"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "question_image_key" character varying`);
        
        await queryRunner.query(`ALTER TABLE "questions" ADD "correctAnswer" character varying(1)`);
        await queryRunner.query(`UPDATE "questions" SET "correctAnswer" = 'A'`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "correctAnswer" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "questions" ADD "solutionNote" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "solution_image_key" character varying`);
        
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "name" character varying`);
        await queryRunner.query(`UPDATE "questions" SET "name" = 'Untitled Question'`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "name" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "question_image_url"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "question_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "solution_image_url"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "solution_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_0043a6d098341fa415351eaf28a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_bab312bafb550a655ece4bca116" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_bab312bafb550a655ece4bca116"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_0043a6d098341fa415351eaf28a"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "solution_image_url"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "solution_image_url" text`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "question_image_url"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "question_image_url" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "name" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "solution_image_key"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "solutionNote"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "correctAnswer"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "question_image_key"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "solution_note" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "correct_answer" character NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "CHK_correct_answer" CHECK ((correct_answer = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar, 'E'::bpchar])))`);
        await queryRunner.query(`CREATE INDEX "IDX_42ee15f944968a00b8843e186a" ON "questions" ("subject_id", "topic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_03d214f92d9f3788afa3d6c6cb" ON "questions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_5800cd25a5888174b2c40e67d4" ON "questions" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_bab312bafb550a655ece4bca116" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_0043a6d098341fa415351eaf28a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
