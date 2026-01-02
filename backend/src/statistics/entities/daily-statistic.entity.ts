import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('daily_statistics')
@Unique(['userId', 'date'])
@Index(['userId', 'date'])
export class DailyStatistic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'questions_solved', default: 0 })
  questionsSolved: number;

  @Column({ name: 'correct_count', default: 0 })
  correctCount: number;

  @Column({ name: 'incorrect_count', default: 0 })
  incorrectCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
