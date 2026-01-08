import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('study_sessions')
@Index(['userId'])
@Index(['userId', 'startedAt'])
export class StudySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'subject_id', nullable: true })
  subjectId?: string; // Hangi derse çalıştı? (Opsiyonel ama çok değerli)

  @Column({ type: 'integer' })
  duration: number; // Kaç dakika sürdü?

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp' })
  endedAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'COMPLETED',
  })
  status: 'COMPLETED' | 'ABORTED'; // Yarıda mı kesti, bitirdi mi?

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subject_id' })
  subject?: Subject;
}

