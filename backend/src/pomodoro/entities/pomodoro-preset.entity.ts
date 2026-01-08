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

  @Column({ name: 'background_image_id', nullable: true })
  backgroundImageId?: string; // Seçtiği arka plan (Local asset ID veya URL)

  @Column({ name: 'sound_id', nullable: true })
  soundId?: string; // Seçtiği ses (Rain, Fire, Silence)

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

