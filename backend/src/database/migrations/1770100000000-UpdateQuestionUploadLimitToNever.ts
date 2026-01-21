import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQuestionUploadLimitToNever1770100000000 implements MigrationInterface {
  name = 'UpdateQuestionUploadLimitToNever1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // question_upload_limit feature'ına sahip tüm plan limitlerinin reset_period'unu NEVER olarak güncelle
    await queryRunner.query(`
      UPDATE "plan_limits"
      SET "reset_period" = 'NEVER'
      WHERE "feature_id" IN (
        SELECT "id" FROM "features"
        WHERE "key" = 'question_upload_limit'
      )
      AND "reset_period" = 'MONTHLY'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Geri alma: NEVER'dan MONTHLY'ye geri döndür
    await queryRunner.query(`
      UPDATE "plan_limits"
      SET "reset_period" = 'MONTHLY'
      WHERE "feature_id" IN (
        SELECT "id" FROM "features"
        WHERE "key" = 'question_upload_limit'
      )
      AND "reset_period" = 'NEVER'
    `);
  }
}
