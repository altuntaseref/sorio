import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoSupportToPomodoroAssets1768200000000
  implements MigrationInterface
{
  name = 'AddVideoSupportToPomodoroAssets1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // pomodoro_assets tablosuna video desteği için kolonlar ekle
    const pomodoroAssetsTable = await queryRunner.getTable('pomodoro_assets');
    if (pomodoroAssetsTable) {
      // file_size kolonu ekle (eğer yoksa)
      const fileSizeColumn = pomodoroAssetsTable.findColumnByName('file_size');
      if (!fileSizeColumn) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_assets" 
          ADD COLUMN "file_size" BIGINT NULL
        `);
      }

      // duration_seconds kolonu ekle (eğer yoksa)
      const durationColumn = pomodoroAssetsTable.findColumnByName(
        'duration_seconds',
      );
      if (!durationColumn) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_assets" 
          ADD COLUMN "duration_seconds" INTEGER NULL
        `);
      }

      // type kolonunu güncelle (IMAGE, SOUND, VIDEO desteklemek için)
      // PostgreSQL'de CHECK constraint ekleyebiliriz
      const typeCheckConstraint = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pomodoro_assets' 
        AND constraint_name = 'check_pomodoro_assets_type'
      `);

      if (typeCheckConstraint.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_assets" 
          ADD CONSTRAINT "check_pomodoro_assets_type" 
          CHECK (type IN ('IMAGE', 'SOUND', 'VIDEO'))
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Constraint'i kaldır
    await queryRunner.query(`
      ALTER TABLE "pomodoro_assets" 
      DROP CONSTRAINT IF EXISTS "check_pomodoro_assets_type"
    `);

    // Kolonları kaldır
    await queryRunner.query(`
      ALTER TABLE "pomodoro_assets" 
      DROP COLUMN IF EXISTS "duration_seconds"
    `);

    await queryRunner.query(`
      ALTER TABLE "pomodoro_assets" 
      DROP COLUMN IF EXISTS "file_size"
    `);
  }
}

