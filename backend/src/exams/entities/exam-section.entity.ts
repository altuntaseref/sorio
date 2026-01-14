import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exam } from './exam.entity';

@Entity('exam_sections')
@Index(['examId', 'key'], { unique: true })
export class ExamSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'exam_id' })
  examId: string;

  @ManyToOne(() => Exam, (exam) => exam.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ type: 'varchar', length: 50 })
  key: string; // 'turkish', 'math', 'science', etc.

  @Column({ type: 'varchar', length: 100 })
  name: string; // 'Türkçe', 'Matematik', 'Fen Bilimleri'

  @Column({ type: 'integer', name: 'question_count', default: 0 })
  questionCount: number; // Kaç soru var

  @Column({ type: 'integer', name: 'order_index', default: 0 })
  orderIndex: number; // Sıralama için

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
