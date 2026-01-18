
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoginLog } from '../../auth/entities/login-log.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ name: 'reset_password_token', nullable: true })
  @Exclude()
  resetPasswordToken?: string;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @Column({
    name: 'first_name',
  })
  firstName: string;

  @Column({
    name: 'last_name',
  })
  lastName: string;

  @Column({
    name: 'avatar_url',
    nullable: true,
  })
  avatarUrl?: string;

  @Column({
    name: 'exam_target',
    nullable: true,
  })
  examTarget?: string; // Deprecated: Artık user_exam_targets kullanılacak

  @Column({
    name: 'active_exam_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  activeExamCode?: string; // Şu anda aktif olan sınav (TYT, AYT_SAY, etc.)

  @Column({ default: 'email' })
  provider: string;

  @Column({ name: 'provider_id', nullable: true })
  providerId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => LoginLog, (loginLog) => loginLog.user, { onDelete: 'CASCADE' })
  loginLogs: LoginLog[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, { onDelete: 'CASCADE' })
  refreshTokens: RefreshToken[];

  @OneToMany(() => Question, (question) => question.user, { onDelete: 'CASCADE' })
  questions: Question[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
