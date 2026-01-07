import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity('question_statistics')
@Unique(['userId', 'questionId'])
@Index(['userId'])
@Index(['questionId'])
export class QuestionStatistic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ name: 'total_attempts', default: 0 })
  totalAttempts: number;

  @Column({ name: 'correct_count', default: 0 })
  correctCount: number;

  @Column({ name: 'incorrect_count', default: 0 })
  incorrectCount: number;

  @Column({ name: 'mastery_level', type: 'int', default: 0 })
  masteryLevel: number; // 0-5 arası: 0=Yeni, 5=Ezberlendi

  @Column({ type: 'timestamp', name: 'last_attempted_at', nullable: true })
  lastAttemptedAt: Date;

  @Column({ type: 'timestamp', name: 'next_review_at', nullable: true })
  nextReviewAt: Date; // Bir sonraki tekrar tarihi

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Question, (question) => question.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
