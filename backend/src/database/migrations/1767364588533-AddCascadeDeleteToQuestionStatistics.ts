import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToQuestionStatistics1767364588533 implements MigrationInterface {
    name = 'AddCascadeDeleteToQuestionStatistics1767364588533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_statistics" DROP CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0"`);
        await queryRunner.query(`ALTER TABLE "question_statistics" ADD CONSTRAINT "FK_663aabaa61e2e1476d5f87f4cd0" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
