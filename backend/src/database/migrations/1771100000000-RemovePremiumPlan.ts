import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePremiumPlan1771100000000 implements MigrationInterface {
    name = 'RemovePremiumPlan1771100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Premium planı bul ve is_active = false yap (silme yerine deaktif et)
        await queryRunner.query(`
            UPDATE "plans" 
            SET "is_active" = false 
            WHERE "code" = 'premium_tier'
        `);
        
        // Alternatif: Eğer tamamen silmek isterseniz (dikkatli olun, user_plans tablosunda referanslar olabilir):
        // Önce premium plana sahip kullanıcıları free tier'a geçir
        // await queryRunner.query(`
        //     UPDATE "user_plans" up
        //     SET "plan_id" = (SELECT id FROM "plans" WHERE code = 'free_tier' LIMIT 1)
        //     WHERE "plan_id" = (SELECT id FROM "plans" WHERE code = 'premium_tier' LIMIT 1)
        // `);
        // 
        // Sonra premium planı sil
        // await queryRunner.query(`
        //     DELETE FROM "plans" WHERE "code" = 'premium_tier'
        // `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Geri alma: Premium planı tekrar aktif et
        await queryRunner.query(`
            UPDATE "plans" 
            SET "is_active" = true 
            WHERE "code" = 'premium_tier'
        `);
    }
}
