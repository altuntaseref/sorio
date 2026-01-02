import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuizSchema1767365613352 implements MigrationInterface {
    name = 'CreateQuizSchema1767365613352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_0043a6d098341fa415351eaf28a"`);
        await queryRunner.query(`CREATE TABLE "daily_statistics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "date" date NOT NULL, "questions_solved" integer NOT NULL DEFAULT '0', "correct_count" integer NOT NULL DEFAULT '0', "incorrect_count" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_4271f83db3980ef94ed0210ca11" UNIQUE ("user_id", "date"), CONSTRAINT "PK_2e439eb49fe85f13821ed3549ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4271f83db3980ef94ed0210ca1" ON "daily_statistics" ("user_id", "date") `);
        await queryRunner.query(`CREATE TABLE "quiz_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quiz_session_id" uuid NOT NULL, "question_id" uuid NOT NULL, "user_answer" character(1) NOT NULL, "is_correct" boolean NOT NULL, "answered_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3fefbc8a840a41b6a15a4f9ca5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_781752319ef69afc3148d50898" ON "quiz_answers" ("quiz_session_id", "question_id") `);
        await queryRunner.query(`CREATE TABLE "quiz_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "mode" character varying(20) NOT NULL, "started_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, "total_questions" integer NOT NULL, "correct_count" integer NOT NULL DEFAULT '0', "incorrect_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_db4ac35661dd2f29269b272a4c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b800b1dc82988f43429fc276e6" ON "quiz_sessions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_663aabaa61e2e1476d5f87f4cd" ON "question_statistics" ("question_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0043a6d098341fa415351eaf28" ON "question_statistics" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "UQ_f82b60bc122a9953f8dbc0668f4" UNIQUE ("user_id", "question_id")`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_0043a6d098341fa415351eaf28a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "daily_statistics" ADD CONSTRAINT "FK_04a83f410c59cdf8115b2a50382" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_f234e11a2d06c1c98edc00066c2" FOREIGN KEY ("quiz_session_id") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_fbe5e1758631924a83c73b521d9" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_sessions" ADD CONSTRAINT "FK_b800b1dc82988f43429fc276e6f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_sessions" DROP CONSTRAINT "FK_b800b1dc82988f43429fc276e6f"`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_fbe5e1758631924a83c73b521d9"`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_f234e11a2d06c1c98edc00066c2"`);
        await queryRunner.query(`ALTER TABLE "daily_statistics" DROP CONSTRAINT "FK_04a83f410c59cdf8115b2a50382"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_0043a6d098341fa415351eaf28a"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "UQ_f82b60bc122a9953f8dbc0668f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0043a6d098341fa415351eaf28"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_663aabaa61e2e1476d5f87f4cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b800b1dc82988f43429fc276e6"`);
        await queryRunner.query(`DROP TABLE "quiz_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_781752319ef69afc3148d50898"`);
        await queryRunner.query(`DROP TABLE "quiz_answers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4271f83db3980ef94ed0210ca1"`);
        await queryRunner.query(`DROP TABLE "daily_statistics"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_0043a6d098341fa415351eaf28a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
