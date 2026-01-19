import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Feature } from './feature.entity';

@Entity('plan_limits')
@Index(['planId', 'featureId'], { unique: true })
export class PlanLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({ name: 'feature_id' })
  featureId: string;

  @Column({ name: 'limit_value', type: 'integer' })
  limitValue: number; // -1 sınırsız

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled: boolean; // BOOLEAN feature'lar için kullanılacak

  @Column({ name: 'reset_period', type: 'varchar', length: 20 })
  resetPeriod: 'DAILY' | 'MONTHLY' | 'NEVER';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Plan, (plan) => plan.planLimits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @ManyToOne(() => Feature, (feature) => feature.planLimits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;
}
