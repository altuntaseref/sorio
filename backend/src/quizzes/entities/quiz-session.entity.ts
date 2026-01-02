import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuizAnswer } from './quiz-answer.entity';

@Entity('quiz_sessions')
@Index(['userId'])
export class QuizSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  mode: 'learning' | 'wrong-answers';

  @CreateDateColumn({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'total_questions' })
  totalQuestions: number;

  @Column({ name: 'correct_count', default: 0 })
  correctCount: number;

  @Column({ name: 'incorrect_count', default: 0 })
  incorrectCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => QuizAnswer, (answer) => answer.quizSession)
  answers: QuizAnswer[];
}
