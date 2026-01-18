import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePricingTables1769600000000 implements MigrationInterface {
  name = 'CreatePricingTables1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "code" character varying(50) NOT NULL,
        "revenue_cat_id" character varying(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_plans_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plans_name" UNIQUE ("name"),
        CONSTRAINT "UQ_plans_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "features" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying(80) NOT NULL,
        "description" text NOT NULL,
        "type" character varying(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_features_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_features_key" UNIQUE ("key"),
        CONSTRAINT "CHK_features_type" CHECK ("type" IN ('BOOLEAN', 'INTEGER'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_limits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "feature_id" uuid NOT NULL,
        "limit_value" integer NOT NULL,
        "reset_period" character varying(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_plan_limits_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plan_limits_plan_feature" UNIQUE ("plan_id", "feature_id"),
        CONSTRAINT "CHK_plan_limits_value" CHECK ("limit_value" >= -1),
        CONSTRAINT "CHK_plan_limits_reset_period" CHECK ("reset_period" IN ('DAILY', 'MONTHLY', 'NEVER'))
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "plan_limits"
      ADD CONSTRAINT "FK_plan_limits_plan"
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "plan_limits"
      ADD CONSTRAINT "FK_plan_limits_feature"
      FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "user_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "feature_id" uuid NOT NULL,
        "usage_count" integer NOT NULL DEFAULT 0,
        "period_start" TIMESTAMP NOT NULL,
        "period_end" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_user_usage_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_usage_user_feature_period" UNIQUE ("user_id", "feature_id", "period_start"),
        CONSTRAINT "CHK_user_usage_count" CHECK ("usage_count" >= 0),
        CONSTRAINT "CHK_user_usage_period" CHECK ("period_end" > "period_start")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_usage"
      ADD CONSTRAINT "FK_user_usage_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_usage"
      ADD CONSTRAINT "FK_user_usage_feature"
      FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "user_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "status" character varying(20) NOT NULL,
        "starts_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ends_at" TIMESTAMP,
        "trial_ends_at" TIMESTAMP,
        "renews_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_user_plans_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_user_plans_status" CHECK ("status" IN ('active', 'paused', 'canceled', 'expired', 'trialing'))
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_plans"
      ADD CONSTRAINT "FK_user_plans_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_plans"
      ADD CONSTRAINT "FK_user_plans_plan"
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_plans_active" ON "user_plans" ("user_id")
      WHERE status IN ('active', 'trialing')
    `);

    await queryRunner.query(`CREATE INDEX "IDX_plan_limits_plan_id" ON "plan_limits" ("plan_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_plan_limits_feature_id" ON "plan_limits" ("feature_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_usage_user_id" ON "user_usage" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_usage_feature_id" ON "user_usage" ("feature_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_plans_user_id" ON "user_plans" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_plans_plan_id" ON "user_plans" ("plan_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_plans_status" ON "user_plans" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_plans_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_plans_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_plans_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_usage_feature_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_usage_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_plan_limits_feature_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_plan_limits_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_user_plans_active"`);

    await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT IF EXISTS "FK_user_plans_plan"`);
    await queryRunner.query(`ALTER TABLE "user_plans" DROP CONSTRAINT IF EXISTS "FK_user_plans_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_plans"`);

    await queryRunner.query(`ALTER TABLE "user_usage" DROP CONSTRAINT IF EXISTS "FK_user_usage_feature"`);
    await queryRunner.query(`ALTER TABLE "user_usage" DROP CONSTRAINT IF EXISTS "FK_user_usage_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_usage"`);

    await queryRunner.query(`ALTER TABLE "plan_limits" DROP CONSTRAINT IF EXISTS "FK_plan_limits_feature"`);
    await queryRunner.query(`ALTER TABLE "plan_limits" DROP CONSTRAINT IF EXISTS "FK_plan_limits_plan"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_limits"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "features"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
  }
}
