import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorPomodoroToPresetsAndAssets1768400000000
  implements MigrationInterface
{
  name = 'RefactorPomodoroToPresetsAndAssets1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. pomodoro_assets tablosunu assets'e rename et
    await queryRunner.query(`
      ALTER TABLE "pomodoro_assets" RENAME TO "assets";
    `);

    // 2. pomodoro_presets tablosunu presets'e rename et
    await queryRunner.query(`
      ALTER TABLE "pomodoro_presets" RENAME TO "presets";
    `);

    // 3. presets tablosuna timer_type kolonu ekle
    await queryRunner.query(`
      ALTER TABLE "presets"
      ADD COLUMN "timer_type" VARCHAR(20) NOT NULL DEFAULT 'POMODORO';
    `);

    // 4. timer_type için CHECK constraint ekle
    await queryRunner.query(`
      ALTER TABLE "presets"
      ADD CONSTRAINT "CHK_presets_timer_type" CHECK ("timer_type" IN ('POMODORO', 'FREE_TIMER'));
    `);

    // 5. timer_type için index ekle
    await queryRunner.query(`
      CREATE INDEX "IDX_presets_timer_type" ON "presets" ("timer_type");
    `);

    // 6. presets tablosundaki pomodoro'ya özel kolonları nullable yap (FREE_TIMER için)
    await queryRunner.query(`
      ALTER TABLE "presets"
      ALTER COLUMN "work_duration" DROP NOT NULL,
      ALTER COLUMN "break_duration" DROP NOT NULL,
      ALTER COLUMN "long_break_duration" DROP NOT NULL,
      ALTER COLUMN "sets_until_long_break" DROP NOT NULL;
    `);

    // 7. Foreign key constraint'leri güncelle (tablo isimleri değişti)
    // background_image_id FK
    await queryRunner.query(`
      ALTER TABLE "presets"
      DROP CONSTRAINT IF EXISTS "FK_presets_background_image_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "presets"
      ADD CONSTRAINT "FK_presets_background_image_id"
      FOREIGN KEY ("background_image_id")
      REFERENCES "assets"("id")
      ON DELETE SET NULL;
    `);

    // sound_id FK
    await queryRunner.query(`
      ALTER TABLE "presets"
      DROP CONSTRAINT IF EXISTS "FK_presets_sound_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "presets"
      ADD CONSTRAINT "FK_presets_sound_id"
      FOREIGN KEY ("sound_id")
      REFERENCES "assets"("id")
      ON DELETE SET NULL;
    `);

    // 8. Index'leri güncelle
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_pomodoro_presets_user_id";
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_presets_user_id" ON "presets" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_presets_user_id_timer_type" ON "presets" ("user_id", "timer_type");
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_pomodoro_assets_user_id";
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assets_user_id" ON "assets" ("user_id");
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_pomodoro_assets_type_is_system_default";
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assets_type_is_system_default" ON "assets" ("type", "is_system_default");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Index'leri geri al
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_assets_type_is_system_default";
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pomodoro_assets_type_is_system_default" ON "assets" ("type", "is_system_default");
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_assets_user_id";
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pomodoro_assets_user_id" ON "assets" ("user_id");
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_presets_user_id_timer_type";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_presets_user_id";
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pomodoro_presets_user_id" ON "presets" ("user_id");
    `);

    // Foreign key constraint'leri geri al
    await queryRunner.query(`
      ALTER TABLE "presets"
      DROP CONSTRAINT IF EXISTS "FK_presets_sound_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "presets"
      DROP CONSTRAINT IF EXISTS "FK_presets_background_image_id";
    `);

    // Kolonları geri al
    await queryRunner.query(`
      ALTER TABLE "presets"
      ALTER COLUMN "work_duration" SET NOT NULL,
      ALTER COLUMN "break_duration" SET NOT NULL,
      ALTER COLUMN "long_break_duration" SET NOT NULL,
      ALTER COLUMN "sets_until_long_break" SET NOT NULL;
    `);

    // timer_type kolonunu ve constraint'lerini kaldır
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_presets_timer_type";
    `);
    await queryRunner.query(`
      ALTER TABLE "presets"
      DROP CONSTRAINT IF EXISTS "CHK_presets_timer_type";
    `);
    await queryRunner.query(`
      ALTER TABLE "presets"
      DROP COLUMN "timer_type";
    `);

    // Tablo isimlerini geri al
    await queryRunner.query(`
      ALTER TABLE "presets" RENAME TO "pomodoro_presets";
    `);
    await queryRunner.query(`
      ALTER TABLE "assets" RENAME TO "pomodoro_assets";
    `);
  }
}
