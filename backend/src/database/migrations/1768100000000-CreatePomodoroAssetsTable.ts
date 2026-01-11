import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePomodoroAssetsTable1768100000000
  implements MigrationInterface
{
  name = 'CreatePomodoroAssetsTable1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // pomodoro_assets tablosu - sadece yoksa oluştur
    const pomodoroAssetsTable = await queryRunner.getTable('pomodoro_assets');
    if (!pomodoroAssetsTable) {
      await queryRunner.query(`
        CREATE TABLE "pomodoro_assets" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "type" character varying(20) NOT NULL,
          "url" text NOT NULL,
          "is_system_default" boolean NOT NULL DEFAULT false,
          "user_id" uuid,
          "name" character varying(200) NOT NULL,
          "r2_key" character varying(500),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_pomodoro_assets" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_pomodoro_assets_user_id" ON "pomodoro_assets" ("user_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_pomodoro_assets_type_system" ON "pomodoro_assets" ("type", "is_system_default")
      `);

      // Foreign key constraint kontrolü
      const fkCheck = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pomodoro_assets' 
        AND constraint_name = 'FK_pomodoro_assets_user_id'
      `);

      if (fkCheck.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_assets" 
          ADD CONSTRAINT "FK_pomodoro_assets_user_id" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
      }
    }

    // pomodoro_presets tablosundaki background_image_id ve sound_id kolonlarını UUID'ye çevir
    // Önce mevcut kolonları kontrol et
    const presetTable = await queryRunner.getTable('pomodoro_presets');
    if (presetTable) {
      const backgroundImageColumn = presetTable.findColumnByName(
        'background_image_id',
      );
      const soundColumn = presetTable.findColumnByName('sound_id');

      // background_image_id kolonunu UUID'ye çevir (eğer varchar ise)
      if (
        backgroundImageColumn &&
        backgroundImageColumn.type !== 'uuid' &&
        backgroundImageColumn.type !== 'uuid'
      ) {
        // Önce mevcut verileri temizle (geçersiz UUID'ler varsa)
        await queryRunner.query(`
          UPDATE "pomodoro_presets" 
          SET "background_image_id" = NULL 
          WHERE "background_image_id" IS NOT NULL 
          AND "background_image_id"::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        `);

        // Kolonu UUID'ye çevir
        await queryRunner.query(`
          ALTER TABLE "pomodoro_presets" 
          ALTER COLUMN "background_image_id" TYPE uuid USING "background_image_id"::uuid
        `);
      }

      // sound_id kolonunu UUID'ye çevir (eğer varchar ise)
      if (
        soundColumn &&
        soundColumn.type !== 'uuid' &&
        soundColumn.type !== 'uuid'
      ) {
        // Önce mevcut verileri temizle (geçersiz UUID'ler varsa)
        await queryRunner.query(`
          UPDATE "pomodoro_presets" 
          SET "sound_id" = NULL 
          WHERE "sound_id" IS NOT NULL 
          AND "sound_id"::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        `);

        // Kolonu UUID'ye çevir
        await queryRunner.query(`
          ALTER TABLE "pomodoro_presets" 
          ALTER COLUMN "sound_id" TYPE uuid USING "sound_id"::uuid
        `);
      }

      // Foreign key constraint'leri ekle (eğer yoksa)
      const fkBackgroundCheck = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pomodoro_presets' 
        AND constraint_name = 'FK_pomodoro_presets_background_image'
      `);

      if (fkBackgroundCheck.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_presets" 
          ADD CONSTRAINT "FK_pomodoro_presets_background_image" 
          FOREIGN KEY ("background_image_id") REFERENCES "pomodoro_assets"("id") 
          ON DELETE SET NULL ON UPDATE NO ACTION
        `);
      }

      const fkSoundCheck = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pomodoro_presets' 
        AND constraint_name = 'FK_pomodoro_presets_sound'
      `);

      if (fkSoundCheck.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_presets" 
          ADD CONSTRAINT "FK_pomodoro_presets_sound" 
          FOREIGN KEY ("sound_id") REFERENCES "pomodoro_assets"("id") 
          ON DELETE SET NULL ON UPDATE NO ACTION
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign key constraint'leri kaldır
    await queryRunner.query(`
      ALTER TABLE "pomodoro_presets" DROP CONSTRAINT IF EXISTS "FK_pomodoro_presets_sound"
    `);
    await queryRunner.query(`
      ALTER TABLE "pomodoro_presets" DROP CONSTRAINT IF EXISTS "FK_pomodoro_presets_background_image"
    `);

    // pomodoro_assets tablosunu sil
    await queryRunner.query(`
      ALTER TABLE "pomodoro_assets" DROP CONSTRAINT IF EXISTS "FK_pomodoro_assets_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_pomodoro_assets_type_system"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_pomodoro_assets_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "pomodoro_assets"
    `);
  }
}


