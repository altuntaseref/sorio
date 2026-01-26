import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Preset } from '../../presets/entities/preset.entity';

@Entity('active_timers')
@Index(['userId'], { unique: true })
export class ActiveTimer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'subject_id', nullable: true })
  subjectId?: string;

  @Column({ name: 'exam_code', type: 'varchar', length: 50, nullable: true })
  examCode?: string;

  @Column({ name: 'timer_type', type: 'varchar', length: 20 })
  timerType: 'POMODORO' | 'FREE_TIMER';

  // === Ortak Alanlar ===
  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date; // Timer'ın başladığı zaman (saniyesine kadar)

  @Column({ name: 'last_updated_at', type: 'timestamp' })
  lastUpdatedAt: Date; // Son güncelleme zamanı

  @Column({ name: 'elapsed_seconds', type: 'integer', default: 0 })
  elapsedSeconds: number; // Geçen süre (saniye cinsinden)

  @Column({ name: 'is_paused', default: false })
  isPaused: boolean;

  // === Pomodoro'ya Özel Alanlar ===
  @Column({ name: 'pomodoro_phase', type: 'varchar', length: 20, nullable: true })
  pomodoroPhase?: 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'; // Hangi aşamada?

  @Column({ name: 'current_set', type: 'integer', nullable: true, default: 1 })
  currentSet?: number; // Kaçıncı set? (1, 2, 3, 4...)

  @Column({ name: 'target_duration_seconds', type: 'integer', nullable: true })
  targetDurationSeconds?: number; // Bu aşama için hedef süre (saniye)

  // Pomodoro preset ayarları (snapshot olarak sakla)
  @Column({ name: 'work_duration_minutes', type: 'integer', nullable: true })
  workDurationMinutes?: number; // Preset'ten alınan değer

  @Column({ name: 'break_duration_minutes', type: 'integer', nullable: true })
  breakDurationMinutes?: number;

  @Column({ name: 'long_break_duration_minutes', type: 'integer', nullable: true })
  longBreakDurationMinutes?: number;

  @Column({ name: 'sets_until_long_break', type: 'integer', nullable: true })
  setsUntilLongBreak?: number; // Kaç sette bir uzun mola?

  @Column({ name: 'preset_id', nullable: true })
  presetId?: string; // Hangi preset kullanıldı?

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subject_id' })
  subject?: Subject;

  @ManyToOne(() => Preset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'preset_id' })
  preset?: Preset;
}
