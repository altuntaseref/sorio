import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuoteCategory {
  GENERAL = 'general',
  MORNING = 'morning',
  NIGHT = 'night',
  STREAK_HIGH = 'streak_high',
  INACTIVE = 'inactive',
  FAILURE = 'failure',
  COLD_START = 'cold_start',
}

@Entity('motivation_quotes')
export class MotivationQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: QuoteCategory,
  })
  category: QuoteCategory;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

