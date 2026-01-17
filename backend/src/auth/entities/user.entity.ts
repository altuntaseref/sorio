import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ name: 'reset_password_token', nullable: true })
  resetPasswordToken?: string;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'exam_target', nullable: true })
  examTarget?: string;

  @Column({ default: 'email' })
  provider: string;

  @Column({ name: 'provider_id', nullable: true })
  providerId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
