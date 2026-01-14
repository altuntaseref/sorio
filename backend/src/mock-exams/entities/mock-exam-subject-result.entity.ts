import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MockExam } from './mock-exam.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('mock_exam_subject_results')
@Index(['mockExamId', 'subjectId'], { unique: true })
export class MockExamSubjectResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'mock_exam_id' })
  mockExamId: string;

  @ManyToOne(() => MockExam, (mockExam) => mockExam.subjectResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mock_exam_id' })
  mockExam: MockExam;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'integer', name: 'correct_count', default: 0 })
  correctCount: number;

  @Column({ type: 'integer', name: 'wrong_count', default: 0 })
  wrongCount: number;

  @Column({ type: 'integer', name: 'empty_count', default: 0 })
  emptyCount: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'net',
  })
  net: number; // Hesaplanan net: doğru - (yanlış / 4)

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
