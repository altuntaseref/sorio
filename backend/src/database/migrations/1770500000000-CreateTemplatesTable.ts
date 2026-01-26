import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplatesTable1770500000000 implements MigrationInterface {
  name = 'CreateTemplatesTable1770500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const templatesTable = await queryRunner.getTable('templates');
    if (!templatesTable) {
      await queryRunner.query(`
        CREATE TABLE "templates" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying(200) NOT NULL,
          "background_image_url" text NOT NULL,
          "sound_url" text,
          "thumbnail_url" text,
          "description" text,
          "is_active" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_templates" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_templates_is_active" ON "templates" ("is_active")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_templates_is_active"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "templates"
    `);
  }
}
