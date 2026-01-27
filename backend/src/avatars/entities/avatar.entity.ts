import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('avatars')
@Index(['isActive'])
export class Avatar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string; // Avatar adı (örn: "Klasik Erkek", "Modern Kadın")

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string; // R2 URL - Image preview (zorunlu)

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl?: string; // R2 URL - Video preview (opsiyonel)

  @Column({ type: 'text', nullable: true })
  description?: string; // Avatar açıklaması

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Aktif mi? (Admin panelden kapatılabilir)

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
