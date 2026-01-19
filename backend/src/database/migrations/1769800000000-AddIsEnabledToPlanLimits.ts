import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsEnabledToPlanLimits1769800000000 implements MigrationInterface {
  name = 'AddIsEnabledToPlanLimits1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plan_limits" ADD "is_enabled" boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`
      UPDATE "plan_limits" pl
      SET "is_enabled" = CASE WHEN pl."limit_value" > 0 THEN true ELSE false END
      FROM "features" f
      WHERE f."id" = pl."feature_id" AND f."type" = 'BOOLEAN'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plan_limits" DROP COLUMN IF EXISTS "is_enabled"`);
  }
}
