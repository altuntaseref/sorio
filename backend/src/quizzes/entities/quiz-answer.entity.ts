import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { QuizSession } from './quiz-session.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity('quiz_answers')
@Index(['quizSessionId', 'questionId'])
export class QuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_session_id' })
  quizSessionId: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ name: 'user_answer', type: 'char', length: 1 })
  userAnswer: 'A' | 'B' | 'C' | 'D' | 'E';

  @Column({ name: 'is_correct' })
  isCorrect: boolean;

  @CreateDateColumn({ name: 'answered_at', type: 'timestamp' })
  answeredAt: Date;

  @ManyToOne(() => QuizSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_session_id' })
  quizSession: QuizSession;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
