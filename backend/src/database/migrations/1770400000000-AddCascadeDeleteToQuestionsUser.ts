import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCascadeDeleteToQuestionsUser1770400000000
  implements MigrationInterface
{
  name = 'AddCascadeDeleteToQuestionsUser1770400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Önce mevcut constraint'i kaldır (eğer varsa)
    await queryRunner.query(`
      ALTER TABLE "questions" 
      DROP CONSTRAINT IF EXISTS "FK_5800cd25a5888174b2c40e67d4b"
    `);

    // CASCADE delete ile yeni constraint ekle
    await queryRunner.query(`
      ALTER TABLE "questions" 
      ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Constraint'i kaldır
    await queryRunner.query(`
      ALTER TABLE "questions" 
      DROP CONSTRAINT IF EXISTS "FK_5800cd25a5888174b2c40e67d4b"
    `);

    // Eski constraint'i geri ekle (CASCADE olmadan)
    await queryRunner.query(`
      ALTER TABLE "questions" 
      ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
    `);
  }
}
