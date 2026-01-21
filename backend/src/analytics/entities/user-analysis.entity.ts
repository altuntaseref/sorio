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

@Entity('user_analyses')
@Index(['userId', 'weekStart'], { unique: true })
@Index(['userId'])
export class UserAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'week_start', type: 'date' })
  weekStart: Date; // Haftanın başlangıç tarihi (Pazartesi)

  @Column({ name: 'week_end', type: 'date' })
  weekEnd: Date; // Haftanın bitiş tarihi (Pazar)

  @Column({ name: 'analysis_text', type: 'text' })
  analysisText: string; // AI tarafından üretilen analiz metni (JSON formatında)

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary?: string; // Özet analiz (ayrı kayıt için)

  @Column({ name: 'categories', type: 'jsonb', nullable: true })
  categories?: any; // Kategorize edilmiş analizler

  @Column({ name: 'r2_key', type: 'varchar', nullable: true })
  r2Key?: string; // R2'ye kaydedildiyse key (opsiyonel)

  @Column({ name: 'r2_url', type: 'text', nullable: true })
  r2Url?: string; // R2'ye kaydedildiyse URL (opsiyonel)

  @Column({ name: 'data_summary', type: 'jsonb', nullable: true })
  dataSummary?: any; // Analiz için kullanılan veri özeti (karşılaştırma için)

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
