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

@Entity('user_exam_targets')
@Index(['userId', 'examCode'], { unique: true })
export class UserExamTarget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50, name: 'exam_code' })
  examCode: string; // 'TYT', 'AYT_SAY', 'LGS', etc.

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
