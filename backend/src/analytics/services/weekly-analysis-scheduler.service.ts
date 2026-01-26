import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserPlan } from '../../pricing/entities/user-plan.entity';
import { Plan } from '../../pricing/entities/plan.entity';
import { DetailedAnalysisAiService } from './detailed-analysis-ai.service';
import { DetailedAnalysisStorageService } from './detailed-analysis-storage.service';
import { PricingUsageService } from '../../pricing/services/pricing-usage.service';

@Injectable()
export class WeeklyAnalysisSchedulerService {
  private readonly logger = new Logger(WeeklyAnalysisSchedulerService.name);

  constructor(
    @InjectRepository(UserPlan)
    private userPlanRepository: Repository<UserPlan>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    private analysisAiService: DetailedAnalysisAiService,
    private analysisStorageService: DetailedAnalysisStorageService,
    private pricingUsageService: PricingUsageService,
  ) {}

  /**
   * Her Pazartesi gece yarısı (00:00) çalışır
   * Önceki hafta için tüm Pro ve Premium kullanıcıların analizini oluşturur
   * - Pro kullanıcılar için: Sadece GENEL analiz
   * - Premium kullanıcılar için: GENEL, SORULAR, ZAMAN, DENEMELER analizleri
   */
  @Cron('0 0 * * 1') // Her Pazartesi gece yarısı (00:00)
  async generateWeeklyAnalyses() {
    this.logger.log('Starting weekly analysis generation for Pro and Premium users...');

    try {
      // Pro ve Premium plan kodlarını bul
      const proAndPremiumPlans = await this.planRepository.find({
        where: [
          { code: 'pro_tier' },
          { code: 'premium_tier' },
        ],
      });

      if (proAndPremiumPlans.length === 0) {
        this.logger.warn('No pro or premium plans found');
        return;
      }

      const planIds = proAndPremiumPlans.map((p) => p.id);

      // Aktif Pro ve Premium kullanıcıları bul
      const activeUsers = await this.userPlanRepository.find({
        where: {
          planId: In(planIds),
          status: In(['active', 'trialing']),
        },
        select: ['userId'],
      });

      const userIds = [...new Set(activeUsers.map((up) => up.userId))];

      this.logger.log(`Found ${userIds.length} Pro and Premium users for analysis`);

      // Bu hafta için analiz oluştur
      const now = new Date();
      const weekStart = this.getWeekStart(now);
      weekStart.setDate(weekStart.getDate() - 7); // Önceki hafta

      // Her kullanıcı için analiz oluştur (paralel, batch'ler halinde)
      const batchSize = 5; // Aynı anda 5 kullanıcı
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((userId) => this.generateAnalysisForUser(userId, weekStart)),
        );
      }

      this.logger.log('Weekly analysis generation completed');
    } catch (error) {
      this.logger.error('Error in weekly analysis generation', error);
    }
  }

  /**
   * Belirli bir kullanıcı için analiz oluştur
   * ÖNEMLİ: Bir kullanıcı haftada sadece 1 kez analiz oluşturabilir!
   */
  async generateAnalysisForUser(userId: string, weekStart: Date) {
    try {
      // Tarihi normalize et
      const normalizedWeekStart = new Date(weekStart);
      normalizedWeekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(normalizedWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // ÖNEMLİ: Bu hafta için analiz zaten var mı kontrol et
      const existing = await this.analysisStorageService.getOrCheckAnalysisForWeek(
        userId,
        normalizedWeekStart,
      );

      if (existing) {
        this.logger.log(
          `Analysis already exists for user ${userId}, week ${normalizedWeekStart.toISOString().split('T')[0]}. Skipping to prevent duplicate charges.`,
        );
        return;
      }

      // Ekstra güvenlik: Son 7 gün içinde analiz oluşturulmuş mu kontrol et
      const hasRecent = await this.analysisStorageService.hasRecentAnalysis(userId, 7);
      if (hasRecent) {
        this.logger.warn(
          `User ${userId} has a recent analysis (within 7 days). Skipping to prevent duplicate charges.`,
        );
        return;
      }

      // Aylık limit kontrolü (4 analiz/ay)
      const canCreateThisMonth = await this.analysisStorageService.canCreateAnalysisThisMonth(userId);
      if (!canCreateThisMonth) {
        this.logger.warn(
          `User ${userId} has reached monthly analysis limit (4 analyses per month). Skipping.`,
        );
        return;
      }

      this.logger.log(
        `Generating analysis for user ${userId}, week ${normalizedWeekStart.toISOString().split('T')[0]}`,
      );

      // Kullanıcının plan tipini kontrol et
      const { plan } = await this.pricingUsageService.getActivePlan(userId);
      const isPremium = plan.code === 'premium_tier';

      // Haftalık analiz oluştur (önceki hafta ile karşılaştırma)
      // Pro kullanıcılar için sadece GENEL, Premium için tüm kategoriler
      const { analysis, dataSummary, scenario } =
        await this.analysisAiService.generateDetailedAnalysis(userId, true, isPremium);

      // Analizi kaydet (R2'ye kaydetme opsiyonel, şimdilik DB'ye kaydet)
      await this.analysisStorageService.saveAnalysis(
        userId,
        normalizedWeekStart,
        weekEnd,
        analysis,
        { ...dataSummary, scenario },
        false, // R2'ye kaydetme (opsiyonel)
      );

      this.logger.log(
        `Analysis generated and saved for user ${userId}, week ${normalizedWeekStart.toISOString().split('T')[0]}`,
      );
    } catch (error) {
      this.logger.error(
        `Error generating analysis for user ${userId}`,
        error,
      );
    }
  }

  /**
   * Paket yükseltme sonrası kullanıcı için analiz oluştur
   * Sadece Pro veya Premium plana geçişte çalışır
   * Önceki hafta için analiz oluşturur
   */
  async generateAnalysisForUserOnUpgrade(userId: string): Promise<void> {
    try {
      // Kullanıcının aktif planını kontrol et
      const { plan } = await this.pricingUsageService.getActivePlan(userId);
      const isPro = plan.code === 'pro_tier';
      const isPremium = plan.code === 'premium_tier';

      // Sadece Pro veya Premium kullanıcılar için analiz oluştur
      if (!isPro && !isPremium) {
        this.logger.log(
          `User ${userId} is not on Pro or Premium plan. Skipping analysis generation.`,
        );
        return;
      }

      this.logger.log(
        `Generating analysis for upgraded user ${userId} (Plan: ${plan.code})`,
      );

      // Önceki hafta için analiz oluştur
      const now = new Date();
      const weekStart = this.getWeekStart(now);
      weekStart.setDate(weekStart.getDate() - 7); // Önceki hafta
      weekStart.setHours(0, 0, 0, 0);

      // Analiz oluştur (generateAnalysisForUser zaten tüm kontrolleri yapıyor)
      await this.generateAnalysisForUser(userId, weekStart);

      this.logger.log(
        `Analysis generation completed for upgraded user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error generating analysis for upgraded user ${userId}`,
        error,
      );
    }
  }

  /**
   * Haftanın başlangıç gününü (Pazartesi) bulur
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi = 1
    return new Date(d.setDate(diff));
  }
}
