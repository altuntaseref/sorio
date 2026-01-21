import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../pricing/entities/plan.entity';
import { UserPlan } from '../../pricing/entities/user-plan.entity';
import { UserUsage } from '../../pricing/entities/user-usage.entity';
import {
  RevenueCatWebhookDto,
  RevenueCatEventType,
} from '../dto/revenue-cat-webhook.dto';

@Injectable()
export class RevenueCatWebhookService {
  private readonly logger = new Logger(RevenueCatWebhookService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private userPlanRepository: Repository<UserPlan>,
    @InjectRepository(UserUsage)
    private userUsageRepository: Repository<UserUsage>,
    private dataSource: DataSource,
  ) {}

  async handleWebhook(webhookDto: RevenueCatWebhookDto): Promise<void> {
    const { event } = webhookDto;
    const userId = event.app_user_id;

    this.logger.log(
      `Processing RevenueCat webhook: ${event.type} for user ${userId}`,
    );

    // User'ı bul
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    // Product ID'den plan code'unu çıkar (örn: pro_monthly -> pro_tier)
    const planCode = this.extractPlanCodeFromProductId(event.product_id);
    if (!planCode) {
      throw new BadRequestException(
        `Could not extract plan code from product_id: ${event.product_id}`,
      );
    }

    // Plan'ı bul (revenue_cat_id veya code ile)
    const plan = await this.planRepository.findOne({
      where: [
        { revenueCatId: event.product_id },
        { code: planCode },
      ],
    });

    if (!plan) {
      throw new NotFoundException(
        `Plan not found for product_id: ${event.product_id}`,
      );
    }

    // Event type'a göre işlem yap
    switch (event.type) {
      case RevenueCatEventType.INITIAL_PURCHASE:
        await this.handleInitialPurchase(user, plan, event);
        break;

      case RevenueCatEventType.RENEWAL:
        await this.handleRenewal(user, plan, event);
        break;

      case RevenueCatEventType.EXPIRATION:
      case RevenueCatEventType.CANCELLATION:
      case RevenueCatEventType.BILLING_ISSUE:
        await this.handleExpiration(user, event);
        break;

      case RevenueCatEventType.PRODUCT_CHANGE:
        await this.handleProductChange(user, plan, event);
        break;

      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleInitialPurchase(
    user: User,
    plan: Plan,
    event: any,
  ): Promise<void> {
    const startsAt = event.purchased_at_ms
      ? new Date(event.purchased_at_ms)
      : new Date();
    const endsAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : this.calculateEndDate(startsAt, plan.billingPeriod);

    await this.dataSource.transaction(async (manager) => {
      // Eski aktif planları expire et
      await manager
        .createQueryBuilder()
        .update(UserPlan)
        .set({ status: 'expired' })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('status IN (:...statuses)', {
          statuses: ['active', 'trialing'],
        })
        .execute();

      // Yeni plan oluştur
      const newUserPlan = new UserPlan();
      newUserPlan.userId = user.id;
      newUserPlan.planId = plan.id;
      newUserPlan.status = 'active';
      newUserPlan.startsAt = startsAt;
      newUserPlan.endsAt = endsAt ?? undefined;
      newUserPlan.renewsAt = endsAt ?? undefined;

      await manager.save(UserPlan, newUserPlan);

      // Aylık limitleri sıfırla (yeni paket başladığı için)
      await this.resetMonthlyLimits(manager, user.id);
    });

    this.logger.log(
      `Initial purchase processed: User ${user.id} -> Plan ${plan.code}`,
    );
  }

  private async handleRenewal(
    user: User,
    plan: Plan,
    event: any,
  ): Promise<void> {
    const endsAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : this.calculateEndDate(new Date(), plan.billingPeriod);

    await this.dataSource.transaction(async (manager) => {
      // Aktif planı bul ve güncelle
      const activePlan = await manager.findOne(UserPlan, {
        where: {
          userId: user.id,
          planId: plan.id,
          status: In(['active', 'trialing']),
        },
      });

      if (activePlan) {
        activePlan.endsAt = endsAt ?? undefined;
        activePlan.renewsAt = endsAt ?? undefined;
        activePlan.status = 'active';
        await manager.save(UserPlan, activePlan);
      } else {
        // Eğer aktif plan yoksa yeni oluştur
        const newUserPlan = new UserPlan();
        newUserPlan.userId = user.id;
        newUserPlan.planId = plan.id;
        newUserPlan.status = 'active';
        newUserPlan.startsAt = new Date();
        newUserPlan.endsAt = endsAt ?? undefined;
        newUserPlan.renewsAt = endsAt ?? undefined;
        await manager.save(UserPlan, newUserPlan);
      }

      // Aylık limitleri sıfırla (yenileme olduğu için)
      await this.resetMonthlyLimits(manager, user.id);
    });

    this.logger.log(
      `Renewal processed: User ${user.id} -> Plan ${plan.code} until ${endsAt}`,
    );
  }

  private async handleExpiration(user: User, event: any): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Aktif planları expire et
      await manager
        .createQueryBuilder()
        .update(UserPlan)
        .set({ status: 'expired' })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('status IN (:...statuses)', {
          statuses: ['active', 'trialing'],
        })
        .execute();

      // Free tier planına geç
      const freePlan = await manager.findOne(Plan, {
        where: { code: 'free_tier' },
      });

      if (freePlan) {
        const freeUserPlan = new UserPlan();
        freeUserPlan.userId = user.id;
        freeUserPlan.planId = freePlan.id;
        freeUserPlan.status = 'active';
        freeUserPlan.startsAt = new Date();
        freeUserPlan.endsAt = undefined; // Free tier sınırsız
        freeUserPlan.renewsAt = undefined;
        await manager.save(UserPlan, freeUserPlan);
      }
    });

    this.logger.log(`Expiration processed: User ${user.id} -> Free tier`);
  }

  private async handleProductChange(
    user: User,
    plan: Plan,
    event: any,
  ): Promise<void> {
    // Product change genellikle yeni bir plana geçiş demektir
    await this.handleInitialPurchase(user, plan, event);
  }

  private calculateEndDate(
    startDate: Date,
    billingPeriod?: string,
  ): Date | null {
    if (!billingPeriod) {
      return null;
    }

    const endDate = new Date(startDate);

    if (billingPeriod === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingPeriod === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (billingPeriod === 'ONE_TIME') {
      return null; // Sınırsız
    }

    return endDate;
  }

  private extractPlanCodeFromProductId(productId: string): string | null {
    // Product ID formatları: pro_monthly, pro_yearly, premium_monthly, etc.
    // Plan code formatları: pro_tier, premium_tier, free_tier

    // Eğer product_id direkt plan code ise
    if (productId.includes('_tier')) {
      return productId;
    }

    // Product ID'den plan adını çıkar
    const parts = productId.split('_');
    if (parts.length >= 1) {
      const planName = parts[0]; // pro, premium, etc.
      return `${planName}_tier`;
    }

    return null;
  }

  private async resetMonthlyLimits(
    manager: any,
    userId: string,
  ): Promise<void> {
    // MONTHLY reset period'a sahip tüm user_usage kayıtlarını sil
    // Bu, yeni paket başladığında aylık limitlerin sıfırlanması için
    await manager.query(
      `
      DELETE FROM user_usage
      WHERE user_id = $1
      AND feature_id IN (
        SELECT pl.feature_id
        FROM plan_limits pl
        JOIN features f ON f.id = pl.feature_id
        WHERE pl.reset_period = 'MONTHLY'
      )
    `,
      [userId],
    );
  }
}
