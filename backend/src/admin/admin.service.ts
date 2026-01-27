import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginLog } from '../auth/entities/login-log.entity';
import { Plan } from '../pricing/entities/plan.entity';
import { Feature } from '../pricing/entities/feature.entity';
import { PlanLimit } from '../pricing/entities/plan-limit.entity';
import { UserPlan } from '../pricing/entities/user-plan.entity';
import { Question } from '../questions/entities/question.entity';
import { QuizSession } from '../quizzes/entities/quiz-session.entity';
import { MockExam } from '../mock-exams/entities/mock-exam.entity';
import { UserAnalysis } from '../analytics/entities/user-analysis.entity';
import { CreatePlanDto, UpdatePlanDto, UpdateUserPlanDto } from './dto/plan.dto';
import { CreateFeatureDto, UpdateFeatureDto } from './dto/feature.dto';
import { UpdatePlanLimitDto } from './dto/plan-limit.dto';
import { PricingService } from '../pricing/pricing.service';
import { WeeklyAnalysisSchedulerService } from '../analytics/services/weekly-analysis-scheduler.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LoginLog)
    private loginLogRepository: Repository<LoginLog>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(PlanLimit)
    private planLimitRepository: Repository<PlanLimit>,
    @InjectRepository(UserPlan)
    private userPlanRepository: Repository<UserPlan>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuizSession)
    private quizSessionRepository: Repository<QuizSession>,
    @InjectRepository(MockExam)
    private mockExamRepository: Repository<MockExam>,
    @InjectRepository(UserAnalysis)
    private userAnalysisRepository: Repository<UserAnalysis>,
    private dataSource: DataSource,
    private pricingService: PricingService,
    @Inject(forwardRef(() => WeeklyAnalysisSchedulerService))
    private weeklyAnalysisSchedulerService: WeeklyAnalysisSchedulerService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalQuestions, totalQuizSessions, totalMockExams] =
      await Promise.all([
        this.userRepository.count(),
        this.questionRepository.count(),
        this.quizSessionRepository.count(),
        this.mockExamRepository.count(),
      ]);

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const newUsersLast7Days = await this.userRepository.count({
      where: { createdAt: MoreThanOrEqual(since) },
    });

    return {
      totalUsers,
      newUsersLast7Days,
      totalQuestions,
      totalQuizSessions,
      totalMockExams,
    };
  }

  async listUsers(page = 1, limit = 20, search?: string, planCode?: string) {
    const skip = (page - 1) * limit;

    const qb = this.userRepository.createQueryBuilder('user');

    if (search) {
      qb.andWhere('user.email ILIKE :search', { search: `%${search}%` });
    }

    if (planCode) {
      qb.leftJoin(UserPlan, 'userPlan', 'userPlan.userId = user.id')
        .leftJoin(Plan, 'plan', 'plan.id = userPlan.planId')
        .andWhere('plan.code = :planCode', { planCode })
        .andWhere('userPlan.status IN (:...statuses)', { statuses: ['active', 'trialing'] });
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const userIds = users.map((user) => user.id);

    const lastLoginRows = userIds.length
      ? await this.dataSource.query(
          `
          SELECT "user_id" AS "userId", MAX("created_at") AS "lastLoginAt"
          FROM "login_logs"
          WHERE "user_id" = ANY($1)
          GROUP BY "user_id"
        `,
          [userIds],
        )
      : [];

    const lastLoginByUserId = new Map<string, Date>(
      lastLoginRows.map((row: { userId: string; lastLoginAt: string }) => [
        row.userId,
        row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      ]),
    );

    const activePlans = userIds.length
      ? await this.userPlanRepository
          .createQueryBuilder('userPlan')
          .leftJoinAndSelect('userPlan.plan', 'plan')
          .where('userPlan.user_id IN (:...userIds)', { userIds })
          .andWhere('userPlan.status IN (:...statuses)', { statuses: ['active', 'trialing'] })
          .orderBy('userPlan.created_at', 'DESC')
          .getMany()
      : [];

    const planByUserId = new Map<string, UserPlan>();
    activePlans.forEach((userPlan) => {
      if (!planByUserId.has(userPlan.userId)) {
        planByUserId.set(userPlan.userId, userPlan);
      }
    });

    return {
      total,
      page,
      limit,
      data: users.map((user) => {
        const lastLogin = lastLoginByUserId.get(user.id) ?? null;
        const userPlan = planByUserId.get(user.id);
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: lastLogin,
          activePlan: userPlan
            ? {
                id: userPlan.plan.id,
                name: userPlan.plan.name,
                code: userPlan.plan.code,
                status: userPlan.status,
              }
            : null,
        };
      }),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [lastLogin, questionsCount, quizCount, mockExamCount] = await Promise.all([
      this.loginLogRepository.findOne({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
      }),
      this.questionRepository.count({ where: { userId } }),
      this.quizSessionRepository.count({ where: { userId } }),
      this.mockExamRepository.count({ where: { userId } }),
    ]);

    const pricing = await this.pricingService.getMobilePricing(userId);

    return {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: lastLogin?.createdAt ?? null,
      },
      activitySummary: {
        questionsCount,
        quizSessionsCount: quizCount,
        mockExamsCount: mockExamCount,
      },
      pricing,
    };
  }

  async getPlans() {
    return this.planRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = this.planRepository.create(dto);
    const savedPlan = await this.planRepository.save(plan);

    const features = await this.featureRepository.find();
    if (features.length) {
      await this.planLimitRepository.upsert(
        features.map((feature) => ({
          planId: savedPlan.id,
          featureId: feature.id,
          limitValue: 0,
          resetPeriod: feature.type === 'BOOLEAN' ? 'NEVER' : 'MONTHLY',
          isEnabled: false,
        })),
        ['planId', 'featureId'],
      );
    }

    return savedPlan;
  }

  async updatePlan(planId: string, dto: UpdatePlanDto) {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    Object.assign(plan, dto);
    return this.planRepository.save(plan);
  }

  async getFeatures() {
    return this.featureRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createFeature(dto: CreateFeatureDto) {
    const feature = this.featureRepository.create(dto);
    const savedFeature = await this.featureRepository.save(feature);

    const plans = await this.planRepository.find();
    if (plans.length) {
      await this.planLimitRepository.upsert(
        plans.map((plan) => ({
          planId: plan.id,
          featureId: savedFeature.id,
          limitValue: 0,
          resetPeriod: savedFeature.type === 'BOOLEAN' ? 'NEVER' : 'MONTHLY',
          isEnabled: false,
        })),
        ['planId', 'featureId'],
      );
    }

    return savedFeature;
  }

  async updateFeature(featureId: string, dto: UpdateFeatureDto) {
    const feature = await this.featureRepository.findOne({ where: { id: featureId } });
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }
    Object.assign(feature, dto);
    return this.featureRepository.save(feature);
  }

  async deleteFeature(featureId: string) {
    const feature = await this.featureRepository.findOne({ where: { id: featureId } });
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }
    await this.featureRepository.remove(feature);
    return { success: true };
  }

  async getPlanLimits() {
    return this.planLimitRepository.find({
      relations: ['plan', 'feature'],
      order: { createdAt: 'ASC' },
    });
  }

  async updatePlanLimits(limits: UpdatePlanLimitDto[]) {
    if (!limits?.length) {
      throw new BadRequestException('No plan limits provided');
    }

    const featureIds = limits.map((limit) => limit.featureId);
    const features = await this.featureRepository.find({
      where: { id: In(featureIds) },
    });
    const featureTypeById = new Map(features.map((feature) => [feature.id, feature.type]));

    const payload: Array<Partial<PlanLimit>> = limits.map((limit) => {
      const type = featureTypeById.get(limit.featureId);
      if (!type) {
        throw new BadRequestException(`Feature not found: ${limit.featureId}`);
      }

      if (type === 'INTEGER') {
        if (limit.limitValue === undefined || limit.limitValue === null) {
          throw new BadRequestException('limitValue is required for INTEGER features');
        }
        return {
          planId: limit.planId,
          featureId: limit.featureId,
          limitValue: limit.limitValue,
          resetPeriod: limit.resetPeriod as PlanLimit['resetPeriod'],
          isEnabled: false,
        };
      }

      const isEnabled =
        limit.isEnabled !== undefined ? limit.isEnabled : (limit.limitValue ?? 0) > 0;
      return {
        planId: limit.planId,
        featureId: limit.featureId,
        limitValue: isEnabled ? 1 : 0,
        resetPeriod: 'NEVER' as PlanLimit['resetPeriod'],
        isEnabled,
      };
    });

    await this.planLimitRepository.upsert(payload, ['planId', 'featureId']);

    return this.getPlanLimits();
  }

  async updateUserPlan(userId: string, dto: UpdateUserPlanDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = dto.planId
      ? await this.planRepository.findOne({ where: { id: dto.planId } })
      : dto.planCode
        ? await this.planRepository.findOne({ where: { code: dto.planCode } })
        : null;

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const status = dto.status ?? 'active';
    // Başlama tarihi DTO'dan gelirse onu kullan, yoksa şu anki tarihi kullan
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();

    // Billing period'a göre bitiş tarihini hesapla
    let endsAt: Date | null = null;
    let renewsAt: Date | null = null;

    if (plan.billingPeriod === 'MONTHLY') {
      endsAt = new Date(startsAt);
      endsAt.setMonth(endsAt.getMonth() + 1);
      renewsAt = new Date(endsAt);
    } else if (plan.billingPeriod === 'YEARLY') {
      endsAt = new Date(startsAt);
      endsAt.setFullYear(endsAt.getFullYear() + 1);
      renewsAt = new Date(endsAt);
    } else if (plan.billingPeriod === 'ONE_TIME') {
      // ONE_TIME için sınırsız (null) veya çok uzun bir tarih
      endsAt = null;
      renewsAt = null;
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(UserPlan)
        .set({ status: 'expired' })
        .where('user_id = :userId', { userId })
        .andWhere('status IN (:...statuses)', { statuses: ['active', 'trialing'] })
        .execute();

      const newUserPlan = new UserPlan();
      newUserPlan.userId = userId;
      newUserPlan.planId = plan.id;
      newUserPlan.status = status;
      newUserPlan.startsAt = startsAt;
      newUserPlan.endsAt = endsAt ?? undefined;
      newUserPlan.renewsAt = renewsAt ?? undefined;

      await manager.save(UserPlan, newUserPlan);
    });

    // Pro plana geçişte analiz oluştur
    if (plan.code === 'pro_tier') {
      // Background'da çalıştır (await etme, hata olursa log'la)
      this.weeklyAnalysisSchedulerService
        .generateAnalysisForUserOnUpgrade(userId)
        .catch((error) => {
          this.logger.error(
            `Failed to generate analysis for upgraded user ${userId}`,
            error,
          );
        });
    }

    return { success: true };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // User entity'sinde CASCADE delete tanımlı olduğu için
    // ilgili tüm kayıtlar otomatik silinecek
    await this.userRepository.remove(user);
    
    return { success: true };
  }

  async deleteUserAnalysis(userId: string, analysisId: string) {
    const analysis = await this.userAnalysisRepository.findOne({
      where: { id: analysisId, userId },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    await this.userAnalysisRepository.remove(analysis);
    
    return { success: true, message: 'Analysis deleted successfully' };
  }

  async getUserAnalyses(userId: string) {
    const analyses = await this.userAnalysisRepository.find({
      where: { userId },
      order: { weekStart: 'DESC' },
    });

    return analyses.map((a) => ({
      id: a.id,
      weekStart: a.weekStart instanceof Date ? a.weekStart.toISOString().split('T')[0] : a.weekStart,
      weekEnd: a.weekEnd instanceof Date ? a.weekEnd.toISOString().split('T')[0] : a.weekEnd,
      createdAt: a.createdAt,
    }));
  }

  async triggerAnalysisForUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Job'u tetikle (background'da çalışır)
    await this.weeklyAnalysisSchedulerService.generateAnalysisForUserOnUpgrade(userId);
    
    return { success: true, message: 'Analysis generation triggered successfully' };
  }
}
