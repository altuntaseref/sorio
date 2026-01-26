import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('templates')
@Index(['isActive'])
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string; // Template adı (örn: "Yağmurlu Gece", "Sakin Orman")

  @Column({ name: 'background_image_url', type: 'text' })
  backgroundImageUrl: string; // R2 URL - Arka plan görseli/video

  @Column({ name: 'sound_url', type: 'text', nullable: true })
  soundUrl?: string; // R2 URL - Ses dosyası (opsiyonel)

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string; // R2 URL - Thumbnail görseli (opsiyonel)

  @Column({ type: 'text', nullable: true })
  description?: string; // Template açıklaması

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Aktif mi? (Admin panelden kapatılabilir)

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
