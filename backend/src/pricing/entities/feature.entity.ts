import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PlanLimit } from './plan-limit.entity';
import { UserUsage } from './user-usage.entity';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  key: string; // ai_solve, pdf_export

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'BOOLEAN' | 'INTEGER';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => PlanLimit, (planLimit) => planLimit.feature)
  planLimits: PlanLimit[];

  @OneToMany(() => UserUsage, (userUsage) => userUsage.feature)
  userUsages: UserUsage[];
}
