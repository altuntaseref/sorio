import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePomodoroTables1768000000000 implements MigrationInterface {
  name = 'CreatePomodoroTables1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // pomodoro_presets tablosu - sadece yoksa oluştur
    const pomodoroPresetsTable = await queryRunner.getTable('pomodoro_presets');
    if (!pomodoroPresetsTable) {
      await queryRunner.query(`
        CREATE TABLE "pomodoro_presets" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "name" character varying(100) NOT NULL,
          "work_duration" integer NOT NULL DEFAULT 25,
          "break_duration" integer NOT NULL DEFAULT 5,
          "long_break_duration" integer NOT NULL DEFAULT 15,
          "sets_until_long_break" integer NOT NULL DEFAULT 4,
          "background_image_id" character varying(255),
          "sound_id" character varying(100),
          "is_default" boolean NOT NULL DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_pomodoro_presets" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_pomodoro_presets_user_id" ON "pomodoro_presets" ("user_id")
      `);

      // Foreign key constraint kontrolü
      const fkCheck = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pomodoro_presets' 
        AND constraint_name = 'FK_pomodoro_presets_user_id'
      `);
      
      if (fkCheck.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "pomodoro_presets" 
          ADD CONSTRAINT "FK_pomodoro_presets_user_id" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
      }
    }

    // study_sessions tablosu - sadece yoksa oluştur
    const studySessionsTable = await queryRunner.getTable('study_sessions');
    if (!studySessionsTable) {
      await queryRunner.query(`
        CREATE TABLE "study_sessions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "subject_id" uuid,
          "duration" integer NOT NULL,
          "started_at" TIMESTAMP NOT NULL,
          "ended_at" TIMESTAMP NOT NULL,
          "status" character varying(20) NOT NULL DEFAULT 'COMPLETED',
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_study_sessions" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_study_sessions_user_id" ON "study_sessions" ("user_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_study_sessions_user_started" ON "study_sessions" ("user_id", "started_at")
      `);

      // Foreign key constraint kontrolü
      const fkUserCheck = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'study_sessions' 
        AND constraint_name = 'FK_study_sessions_user_id'
      `);
      
      if (fkUserCheck.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "study_sessions" 
          ADD CONSTRAINT "FK_study_sessions_user_id" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
      }

      const fkSubjectCheck = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'study_sessions' 
        AND constraint_name = 'FK_study_sessions_subject_id'
      `);
      
      if (fkSubjectCheck.length === 0) {
        await queryRunner.query(`
          ALTER TABLE "study_sessions" 
          ADD CONSTRAINT "FK_study_sessions_subject_id" 
          FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") 
          ON DELETE SET NULL ON UPDATE NO ACTION
        `);
      }
    } else {
      // Tablo varsa, eksik index'leri kontrol et ve ekle
      const indexes = await queryRunner.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'study_sessions'
      `);
      
      const indexNames = indexes.map((idx: any) => idx.indexname);
      
      if (!indexNames.includes('IDX_study_sessions_user_id')) {
        await queryRunner.query(`
          CREATE INDEX "IDX_study_sessions_user_id" ON "study_sessions" ("user_id")
        `);
      }
      
      if (!indexNames.includes('IDX_study_sessions_user_started')) {
        await queryRunner.query(`
          CREATE INDEX "IDX_study_sessions_user_started" ON "study_sessions" ("user_id", "started_at")
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "study_sessions" DROP CONSTRAINT "FK_study_sessions_subject_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "study_sessions" DROP CONSTRAINT "FK_study_sessions_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_study_sessions_user_started"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_study_sessions_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE "study_sessions"
    `);

    await queryRunner.query(`
      ALTER TABLE "pomodoro_presets" DROP CONSTRAINT "FK_pomodoro_presets_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_pomodoro_presets_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE "pomodoro_presets"
    `);
  }
}

