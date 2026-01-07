import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSpacedRepetitionFields1767900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // mastery_level ekle (0-5 arası, default 0)
    await queryRunner.addColumn(
      'question_statistics',
      new TableColumn({
        name: 'mastery_level',
        type: 'integer',
        default: 0,
        isNullable: false,
      }),
    );

    // next_review_at ekle (nullable, başlangıçta NULL)
    await queryRunner.addColumn(
      'question_statistics',
      new TableColumn({
        name: 'next_review_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Check constraint: mastery_level 0-5 arası olmalı
    await queryRunner.query(`
      ALTER TABLE question_statistics 
      ADD CONSTRAINT chk_mastery_level 
      CHECK (mastery_level >= 0 AND mastery_level <= 5)
    `);

    // Index: next_review_at için (sorgu performansı)
    await queryRunner.query(`
      CREATE INDEX idx_question_statistics_next_review 
      ON question_statistics(user_id, next_review_at) 
      WHERE next_review_at IS NOT NULL
    `);

    // Index: mastery_level için
    await queryRunner.query(`
      CREATE INDEX idx_question_statistics_mastery_level 
      ON question_statistics(user_id, mastery_level)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'question_statistics',
      'idx_question_statistics_mastery_level',
    );
    await queryRunner.dropIndex(
      'question_statistics',
      'idx_question_statistics_next_review',
    );
    await queryRunner.query(
      `ALTER TABLE question_statistics DROP CONSTRAINT chk_mastery_level`,
    );
    await queryRunner.dropColumn('question_statistics', 'next_review_at');
    await queryRunner.dropColumn('question_statistics', 'mastery_level');
  }
}

