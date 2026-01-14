import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MockExamSubjectResult } from './mock-exam-subject-result.entity';

@Entity('mock_exams')
@Index(['userId', 'examCode'])
@Index(['examDate'])
export class MockExam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50, name: 'exam_code' })
  examCode: string; // 'TYT', 'AYT_SAY', 'LGS', etc.

  @Column({ type: 'varchar', length: 200, name: 'exam_name' })
  examName: string; // 'Özdebir Türkiye Geneli - 3'

  @Column({ type: 'date', name: 'exam_date' })
  examDate: Date;

  @Column({ type: 'integer', name: 'total_correct', default: 0 })
  totalCorrect: number;

  @Column({ type: 'integer', name: 'total_wrong', default: 0 })
  totalWrong: number;

  @Column({ type: 'integer', name: 'total_empty', default: 0 })
  totalEmpty: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'total_net',
  })
  totalNet: number;

  @Column({ type: 'boolean', name: 'is_record', default: false })
  isRecord: boolean;

  @OneToMany(() => MockExamSubjectResult, (result) => result.mockExam, {
    cascade: true,
  })
  subjectResults: MockExamSubjectResult[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
