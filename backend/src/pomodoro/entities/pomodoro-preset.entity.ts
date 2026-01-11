import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PomodoroAsset } from './pomodoro-asset.entity';

@Entity('pomodoro_presets')
@Index(['userId'])
export class PomodoroPreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Örn: "Matematik Kampı", "Chill", "Hardcore"

  @Column({ name: 'work_duration', default: 25 })
  workDuration: number; // Dakika

  @Column({ name: 'break_duration', default: 5 })
  breakDuration: number; // Dakika

  @Column({ name: 'long_break_duration', default: 15 })
  longBreakDuration: number; // Dakika

  @Column({ name: 'sets_until_long_break', default: 4 })
  setsUntilLongBreak: number; // Kaç sette bir uzun mola?

  @Column({ name: 'background_image_id', nullable: true, type: 'uuid' })
  backgroundImageId?: string; // PomodoroAsset ID (IMAGE tipinde)

  @Column({ name: 'sound_id', nullable: true, type: 'uuid' })
  soundId?: string; // PomodoroAsset ID (SOUND tipinde)

  @ManyToOne(() => PomodoroAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'background_image_id' })
  backgroundImage?: PomodoroAsset;

  @ManyToOne(() => PomodoroAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sound_id' })
  sound?: PomodoroAsset;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean; // Varsayılan olarak bu mu açılsın?

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

