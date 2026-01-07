import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMotivationQuotesTable1767800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'motivation_quotes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'general',
              'morning',
              'night',
              'streak_high',
              'inactive',
              'failure',
              'cold_start',
            ],
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Index for category filtering
    await queryRunner.createIndex(
      'motivation_quotes',
      new TableIndex({
        name: 'IDX_MOTIVATION_QUOTES_CATEGORY',
        columnNames: ['category'],
      }),
    );

    // Index for is_active filtering
    await queryRunner.createIndex(
      'motivation_quotes',
      new TableIndex({
        name: 'IDX_MOTIVATION_QUOTES_IS_ACTIVE',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'motivation_quotes',
      'IDX_MOTIVATION_QUOTES_IS_ACTIVE',
    );
    await queryRunner.dropIndex(
      'motivation_quotes',
      'IDX_MOTIVATION_QUOTES_CATEGORY',
    );
    await queryRunner.dropTable('motivation_quotes');
  }
}

