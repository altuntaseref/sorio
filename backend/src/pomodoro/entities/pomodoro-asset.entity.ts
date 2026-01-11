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

@Entity('pomodoro_assets')
@Index(['userId'])
@Index(['type', 'isSystemDefault'])
export class PomodoroAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  type: 'IMAGE' | 'SOUND' | 'VIDEO'; // Görsel, ses veya video/GIF dosyası

  @Column({ name: 'file_size', nullable: true, type: 'bigint' })
  fileSize?: number; // Dosya boyutu (byte cinsinden)

  @Column({ name: 'duration_seconds', nullable: true, type: 'integer' })
  durationSeconds?: number; // Video/GIF süresi (saniye cinsinden, max 30 saniye)

  @Column({ type: 'text' })
  url: string; // Dosyanın R2/CDN adresi

  @Column({ name: 'is_system_default', default: false })
  isSystemDefault: boolean; // True ise biz yükledik, False ise kullanıcı

  @Column({ name: 'user_id', nullable: true })
  userId?: string; // Eğer sistem default ise null, kullanıcı yüklediyse user_id

  @Column({ type: 'varchar', length: 200 })
  name: string; // "Yağmurlu Gece" veya kullanıcının verdiği isim

  @Column({ name: 'r2_key', nullable: true })
  r2Key?: string; // R2'deki dosya key'i (silme için, sadece kullanıcı yüklediği dosyalar için)

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}


