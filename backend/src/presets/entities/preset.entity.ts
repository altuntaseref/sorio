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
import { Asset } from '../../assets/entities/asset.entity';

@Entity('presets')
@Index(['userId'])
@Index(['userId', 'timerType'])
export class Preset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'timer_type',
    type: 'varchar',
    length: 20,
    default: 'POMODORO',
  })
  timerType: 'POMODORO' | 'FREE_TIMER'; // Pomodoro mu, serbest timer mı?

  @Column({ type: 'varchar', length: 100 })
  name: string; // Örn: "Matematik Kampı", "Gece Çalışma"

  // Pomodoro'ya özel alanlar (opsiyonel, sadece timerType='POMODORO' için)
  @Column({ name: 'work_duration', nullable: true })
  workDuration?: number; // Dakika (Pomodoro için)

  @Column({ name: 'break_duration', nullable: true })
  breakDuration?: number; // Dakika (Pomodoro için)

  @Column({ name: 'long_break_duration', nullable: true })
  longBreakDuration?: number; // Dakika (Pomodoro için)

  @Column({ name: 'sets_until_long_break', nullable: true })
  setsUntilLongBreak?: number; // Kaç sette bir uzun mola? (Pomodoro için)

  // Ortak alanlar (hem Pomodoro hem Free Timer için)
  @Column({ name: 'background_image_id', nullable: true, type: 'uuid' })
  backgroundImageId?: string; // Asset ID (IMAGE veya VIDEO tipinde)

  @Column({ name: 'sound_id', nullable: true, type: 'uuid' })
  soundId?: string; // Asset ID (SOUND tipinde)

  @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'background_image_id' })
  backgroundImage?: Asset;

  @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sound_id' })
  sound?: Asset;

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
