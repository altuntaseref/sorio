import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PlanLimit } from './plan-limit.entity';
import { UserPlan } from './user-plan.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string; // Free, Pro, Premium

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // free_tier, pro_tier

  @Column({ name: 'revenue_cat_id', type: 'varchar', length: 100, nullable: true })
  revenueCatId?: string; // Mobil ödeme eşleşmesi için

  @Column({ name: 'price_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceAmount?: number; // Admin panelde gösterilecek fiyat

  @Column({ name: 'price_currency', type: 'varchar', length: 3, nullable: true })
  priceCurrency?: string; // TRY, USD

  @Column({ name: 'billing_period', type: 'varchar', length: 20, nullable: true })
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

  @Column({ type: 'varchar', length: 120, nullable: true })
  title?: string; // Mobilde görünen başlık (örn: "Temel Deneyim")

  @Column({ type: 'varchar', length: 120, nullable: true })
  badge?: string; // "En Popüler 🔥"

  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMonthly?: number;

  @Column({ name: 'price_yearly', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceYearly?: number;

  @Column({ name: 'button_text', type: 'varchar', length: 120, nullable: true })
  buttonText?: string;

  @Column({ name: 'feature_texts', type: 'text', array: true, nullable: true })
  featureTexts?: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => PlanLimit, (planLimit) => planLimit.plan)
  planLimits: PlanLimit[];

  @OneToMany(() => UserPlan, (userPlan) => userPlan.plan)
  userPlans: UserPlan[];
}
