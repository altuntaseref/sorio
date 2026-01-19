import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanMarketingFields1769900000000 implements MigrationInterface {
  name = 'AddPlanMarketingFields1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "title" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "badge" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "price_monthly" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "price_yearly" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "button_text" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "feature_texts" text array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "feature_texts"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "button_text"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "price_yearly"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "price_monthly"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "badge"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "title"`);
  }
}
