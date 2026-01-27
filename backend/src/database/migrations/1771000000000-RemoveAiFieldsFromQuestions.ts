import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAiFieldsFromQuestions1771000000000 implements MigrationInterface {
    name = 'RemoveAiFieldsFromQuestions1771000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ai_solution kolonunu kaldır
        await queryRunner.query(`
            ALTER TABLE "questions" 
            DROP COLUMN IF EXISTS "ai_solution"
        `);
        
        // is_ai_solved kolonunu kaldır
        await queryRunner.query(`
            ALTER TABLE "questions" 
            DROP COLUMN IF EXISTS "is_ai_solved"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Geri alma: ai_solution kolonunu geri ekle
        await queryRunner.query(`
            ALTER TABLE "questions" 
            ADD COLUMN "ai_solution" text
        `);
        
        // Geri alma: is_ai_solved kolonunu geri ekle
        await queryRunner.query(`
            ALTER TABLE "questions" 
            ADD COLUMN "is_ai_solved" boolean NOT NULL DEFAULT false
        `);
    }
}
