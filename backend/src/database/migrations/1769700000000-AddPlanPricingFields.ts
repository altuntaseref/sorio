import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanPricingFields1769700000000 implements MigrationInterface {
  name = 'AddPlanPricingFields1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" ADD "price_amount" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD "price_currency" character varying(3)`);
    await queryRunner.query(`ALTER TABLE "plans" ADD "billing_period" character varying(20)`);
    await queryRunner.query(
      `ALTER TABLE "plans" ADD CONSTRAINT "CHK_plans_billing_period" CHECK ("billing_period" IN ('MONTHLY', 'YEARLY', 'ONE_TIME'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP CONSTRAINT IF EXISTS "CHK_plans_billing_period"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "billing_period"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "price_currency"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "price_amount"`);
  }
}
