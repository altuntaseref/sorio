import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFieldsToUsers1769100000000 implements MigrationInterface {
  name = 'AddPasswordResetFieldsToUsers1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_password_token" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_password_expires" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "reset_password_expires"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "reset_password_token"
    `);
  }
}

