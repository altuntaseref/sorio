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
@Index(['timerType'])
export class StudySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'subject_id', nullable: true })
  subjectId?: string;

  @Column({ type: 'integer' })
  duration: number; // Dakika cinsinden

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp' })
  endedAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'COMPLETED',
  })
  status: 'COMPLETED' | 'ABORTED';

  @Column({
    name: 'timer_type',
    type: 'varchar',
    length: 20,
    default: 'POMODORO',
    nullable: false,
  })
  timerType: 'POMODORO' | 'FREE_TIMER';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subject_id' })
  subject?: Subject;
}
