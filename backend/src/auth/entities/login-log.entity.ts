import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('login_logs')
export class LoginLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.loginLogs, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  ipAddress!: string;

  @Column()
  userAgent!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
