import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAiSolvedToQuestions1770000000000 implements MigrationInterface {
    name = 'AddIsAiSolvedToQuestions1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "questions" 
            ADD COLUMN "is_ai_solved" boolean NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "questions" 
            DROP COLUMN "is_ai_solved"
        `);
    }
}
