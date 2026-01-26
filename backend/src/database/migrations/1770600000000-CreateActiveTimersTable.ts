import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActiveTimersTable1770600000000 implements MigrationInterface {
  name = 'CreateActiveTimersTable1770600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const activeTimersTable = await queryRunner.getTable('active_timers');
    if (!activeTimersTable) {
      await queryRunner.query(`
        CREATE TABLE "active_timers" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "subject_id" uuid,
          "exam_code" character varying(50),
          "timer_type" character varying(20) NOT NULL,
          "started_at" TIMESTAMP NOT NULL,
          "last_updated_at" TIMESTAMP NOT NULL,
          "elapsed_seconds" integer NOT NULL DEFAULT 0,
          "is_paused" boolean NOT NULL DEFAULT false,
          "pomodoro_phase" character varying(20),
          "current_set" integer DEFAULT 1,
          "target_duration_seconds" integer,
          "work_duration_minutes" integer,
          "break_duration_minutes" integer,
          "long_break_duration_minutes" integer,
          "sets_until_long_break" integer,
          "preset_id" uuid,
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_active_timers" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_active_timers_user_id" UNIQUE ("user_id"),
          CONSTRAINT "FK_active_timers_user_id" FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_active_timers_subject_id" FOREIGN KEY ("subject_id") 
            REFERENCES "subjects"("id") ON DELETE SET NULL,
          CONSTRAINT "FK_active_timers_preset_id" FOREIGN KEY ("preset_id") 
            REFERENCES "presets"("id") ON DELETE SET NULL,
          CONSTRAINT "check_active_timers_timer_type" 
            CHECK (timer_type IN ('POMODORO', 'FREE_TIMER')),
          CONSTRAINT "check_active_timers_pomodoro_phase" 
            CHECK (pomodoro_phase IS NULL OR pomodoro_phase IN ('WORK', 'SHORT_BREAK', 'LONG_BREAK'))
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_active_timers_user_id" ON "active_timers" ("user_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_active_timers_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "active_timers"
    `);
  }
}
