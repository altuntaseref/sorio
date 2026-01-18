import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ExamSection } from './exam-section.entity';

@Entity('exams')
@Index(['code'], { unique: true })
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // 'TYT', 'AYT_SAY', 'LGS', etc.

  @Column({ type: 'varchar', length: 200 })
  name: string; // 'Temel Yeterlilik Testi'

  @Column({ type: 'varchar', length: 50, name: 'short_name' })
  shortName: string; // 'TYT'

  @Column({
    type: 'varchar',
    length: 20,
  })
  level: 'HIGH_SCHOOL' | 'UNIVERSITY' | 'PUBLIC_SECTOR' | 'ACADEMIC';

  @Column({ type: 'integer', name: 'incorrect_to_nullify', default: 4 })
  incorrectToNullify: number; // Kaç yanlış 1 doğruyu götürür

  @Column({ type: 'integer', default: 0 })
  order: number; // Sıralama için

  @Column({ type: 'date', name: 'exam_date', nullable: true })
  examDate?: Date; // Sınav tarihi (manuel girilecek)

  @OneToMany(() => ExamSection, (section) => section.exam, { cascade: true })
  sections: ExamSection[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
