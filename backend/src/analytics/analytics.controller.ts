import { Controller, Get, Query, UseGuards, Post, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AnalyticsService } from './analytics.service';
import { DetailedAnalysisAiService } from './services/detailed-analysis-ai.service';
import { DetailedAnalysisStorageService } from './services/detailed-analysis-storage.service';
import { GetWeeklyActivityDto } from './dto/get-weekly-activity.dto';
import { AnalysisRangeDto } from './dto/analysis-range.dto';
import { User } from '../users/entities/user.entity';
import { FeatureAccess } from '../pricing/decorators/feature-access.decorator';
import { FeatureAccessGuard } from '../pricing/guards/feature-access.guard';
import { PricingUsageService } from '../pricing/services/pricing-usage.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly detailedAnalysisAiService: DetailedAnalysisAiService,
    private readonly analysisStorageService: DetailedAnalysisStorageService,
    private readonly pricingUsageService: PricingUsageService,
  ) {}

  @Get('overview')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('basic_analytics')
  async getAnalyticsOverview(@GetUser('id') userId: string) {
    const data = await this.analyticsService.getAnalyticsOverview(userId);
    return { success: true, data };
  }

  @Get('weekly-activity')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('basic_analytics')
  getWeeklyActivity(
    @GetUser() user: User,
    @Query() getWeeklyActivityDto: GetWeeklyActivityDto,
  ) {
    return this.analyticsService.getWeeklyActivity(
      user.id,
      getWeeklyActivityDto.weeks,
    );
  }

  @Get('subjects')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('basic_analytics')
  async getSubjectStatistics(@GetUser('id') userId: string) {
    const data = await this.analyticsService.getSubjectStatistics(userId);
    return { success: true, data };
  }

  @Get('general')
  async getGeneralAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
  ) {
    const data = await this.analyticsService.getAnalysisGeneral(
      userId,
      rangeDto.range,
    );
    return { success: true, data };
  }

  @Get('questions')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getQuestionAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
  ) {
    const data = await this.analyticsService.getAnalysisQuestions(
      userId,
      rangeDto.range,
    );
    return { success: true, data };
  }

  @Get('time')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getTimeAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
  ) {
    const data = await this.analyticsService.getAnalysisTime(
      userId,
      rangeDto.range,
    );
    return { success: true, data };
  }

  @Get('exams')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('mock_exam_analytics')
  async getExamAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
    @Query('examCode') examCode?: string,
  ) {
    const data = await this.analyticsService.getAnalysisExams(
      userId,
      rangeDto.range,
      examCode,
    );
    return { success: true, data };
  }

  /**
   * Yapay zeka ile detaylı performans analizi (Haftalık, önceki hafta ile karşılaştırma)
   * POST /api/analytics/detailed-analysis
   * Sadece premium kullanıcılar için
   * ÖNEMLİ: Bir kullanıcı haftada sadece 1 kez analiz oluşturabilir!
   */
  @Post('detailed-analysis')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getDetailedAnalysis(@GetUser('id') userId: string) {
    // Plan kontrolü
    const { plan } = await this.pricingUsageService.getActivePlan(userId);
    const isPro = plan.code === 'pro_tier';
    const isPremium = plan.code === 'premium_tier';
    const isFree = plan.code === 'free_tier';

    // Free kullanıcılar analiz alamaz
    if (isFree) {
      throw new ForbiddenException('This feature is only available for Pro and Premium users');
    }

    // Pro veya Premium kontrolü
    if (!isPro && !isPremium) {
      throw new ForbiddenException('This feature is only available for Pro and Premium users');
    }

    // Hafta tarihlerini hesapla (önceki hafta için analiz oluşturulacak)
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    weekStart.setDate(weekStart.getDate() - 7); // Önceki hafta
    weekStart.setHours(0, 0, 0, 0); // Tarihi normalize et
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // ÖNEMLİ: Aylık limit kontrolü (4 analiz/ay)
    const canCreateThisMonth = await this.analysisStorageService.canCreateAnalysisThisMonth(userId);
    if (!canCreateThisMonth) {
      // Bu ay için limit dolmuş, en son analizi döndür
      const latest = await this.analysisStorageService.getLatestAnalysis(userId);
      if (latest) {
        let parsedAnalysis: any;
        try {
          parsedAnalysis = JSON.parse(latest.analysisText);
        } catch {
          if (latest.categories) {
            parsedAnalysis = {
              general: latest.categories.general || latest.summary || latest.analysisText,
              questions: latest.categories.questions || '',
              time: latest.categories.time || '',
              mockExams: latest.categories.mockExams || '',
            };
          } else {
            parsedAnalysis = {
              general: latest.summary || latest.analysisText,
              questions: '',
              time: '',
              mockExams: '',
            };
          }
        }

        // Plan tipine göre response düzenle
        const responseData: any = {
          id: latest.id,
          weekStart: latest.weekStart.toISOString().split('T')[0],
          weekEnd: latest.weekEnd.toISOString().split('T')[0],
          general: parsedAnalysis.general,
          savedAt: latest.createdAt,
          isExisting: true,
          message: 'Monthly analysis limit reached (4 analyses per month). Returning your latest analysis.',
        };

        // Premium kullanıcılar için tüm kategoriler
        if (isPremium) {
          responseData.questions = parsedAnalysis.questions;
          responseData.time = parsedAnalysis.time;
          responseData.mockExams = parsedAnalysis.mockExams;
        }

        return {
          success: true,
          data: responseData,
        };
      }
      throw new ForbiddenException('Monthly analysis limit reached (4 analyses per month)');
    }

    // ÖNEMLİ: Bu hafta için analiz zaten var mı kontrol et
    const existingAnalysis = await this.analysisStorageService.getOrCheckAnalysisForWeek(
      userId,
      weekStart,
    );

    if (existingAnalysis) {
      // Mevcut analizi parse et ve döndür
      let parsedAnalysis: any;
      try {
        parsedAnalysis = JSON.parse(existingAnalysis.analysisText);
      } catch {
        // Eski format (düz metin veya kategorize edilmiş)
        if (existingAnalysis.categories) {
          parsedAnalysis = {
            general: existingAnalysis.categories.general || existingAnalysis.summary || existingAnalysis.analysisText,
            questions: existingAnalysis.categories.questions || '',
            time: existingAnalysis.categories.time || '',
            mockExams: existingAnalysis.categories.mockExams || '',
          };
        } else {
          parsedAnalysis = {
            general: existingAnalysis.summary || existingAnalysis.analysisText,
            questions: '',
            time: '',
            mockExams: '',
          };
        }
      }

      // Plan tipine göre response düzenle
      const responseData: any = {
        id: existingAnalysis.id,
        weekStart: existingAnalysis.weekStart.toISOString().split('T')[0],
        weekEnd: existingAnalysis.weekEnd.toISOString().split('T')[0],
        general: parsedAnalysis.general,
        savedAt: existingAnalysis.createdAt,
        isExisting: true,
        message: 'Analysis for this week already exists. Returning existing analysis.',
      };

      // Premium kullanıcılar için tüm kategoriler
      if (isPremium) {
        responseData.questions = parsedAnalysis.questions;
        responseData.time = parsedAnalysis.time;
        responseData.mockExams = parsedAnalysis.mockExams;
      }

      return {
        success: true,
        data: responseData,
      };
    }

    // Ekstra güvenlik: Son 7 gün içinde analiz oluşturulmuş mu kontrol et
    const hasRecent = await this.analysisStorageService.hasRecentAnalysis(userId, 7);
    if (hasRecent) {
      // Son 7 gün içinde analiz varsa, en son olanı döndür
      const latest = await this.analysisStorageService.getLatestAnalysis(userId);
      if (latest) {
        let parsedAnalysis: any;
        try {
          parsedAnalysis = JSON.parse(latest.analysisText);
        } catch {
          if (latest.categories) {
            parsedAnalysis = {
              general: latest.categories.general || latest.summary || latest.analysisText,
              questions: latest.categories.questions || '',
              time: latest.categories.time || '',
              mockExams: latest.categories.mockExams || '',
            };
          } else {
            parsedAnalysis = {
              general: latest.summary || latest.analysisText,
              questions: '',
              time: '',
              mockExams: '',
            };
          }
        }

        // Plan tipine göre response düzenle
        const responseData: any = {
          id: latest.id,
          weekStart: latest.weekStart.toISOString().split('T')[0],
          weekEnd: latest.weekEnd.toISOString().split('T')[0],
          general: parsedAnalysis.general,
          savedAt: latest.createdAt,
          isExisting: true,
          message: 'You have already generated an analysis this week. Returning your latest analysis.',
        };

        // Premium kullanıcılar için tüm kategoriler
        if (isPremium) {
          responseData.questions = parsedAnalysis.questions;
          responseData.time = parsedAnalysis.time;
          responseData.mockExams = parsedAnalysis.mockExams;
        }

        return {
          success: true,
          data: responseData,
        };
      }
    }

    // Yeni analiz oluştur (önceki hafta ile karşılaştırma)
    // Pro kullanıcılar için sadece GENEL, Premium için tüm kategoriler
    const { analysis, dataSummary, scenario } =
      await this.detailedAnalysisAiService.generateDetailedAnalysis(
        userId,
        true,
        isPremium, // Premium kontrolü
      );

    // Analizi kaydet (R2'ye kaydetme opsiyonel, şimdilik DB'ye kaydet)
    const saved = await this.analysisStorageService.saveAnalysis(
      userId,
      weekStart,
      weekEnd,
      analysis,
      { ...dataSummary, scenario },
      false, // R2'ye kaydetme (opsiyonel)
    );

    // Plan tipine göre response düzenle
    const responseData: any = {
      id: saved.id,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      general: analysis.general,
      savedAt: saved.createdAt,
      isExisting: false,
    };

    // Premium kullanıcılar için tüm kategoriler
    if (isPremium) {
      responseData.questions = analysis.questions;
      responseData.time = analysis.time;
      responseData.mockExams = analysis.mockExams;
    }

    return {
      success: true,
      data: responseData,
    };
  }

  /**
   * Kaydedilmiş haftalık analizleri getir
   * GET /api/analytics/detailed-analysis
   */
  @Get('detailed-analysis')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getSavedAnalyses(@GetUser('id') userId: string) {
    // Plan kontrolü
    const { plan } = await this.pricingUsageService.getActivePlan(userId);
    const isPro = plan.code === 'pro_tier';
    const isPremium = plan.code === 'premium_tier';
    const isFree = plan.code === 'free_tier';

    // Free kullanıcılar analiz alamaz
    if (isFree) {
      throw new ForbiddenException('This feature is only available for Pro and Premium users');
    }

    if (!isPro && !isPremium) {
      throw new ForbiddenException('This feature is only available for Pro and Premium users');
    }

    const analyses = await this.analysisStorageService.getAllAnalyses(userId);

    return {
      success: true,
      data: analyses.map((a) => {
        let parsedAnalysis: any;
        try {
          parsedAnalysis = JSON.parse(a.analysisText);
        } catch {
          if (a.categories) {
            parsedAnalysis = {
              general: a.categories.general || a.summary || a.analysisText,
              questions: a.categories.questions || '',
              time: a.categories.time || '',
              mockExams: a.categories.mockExams || '',
            };
          } else {
            parsedAnalysis = {
              general: a.summary || a.analysisText,
              questions: '',
              time: '',
              mockExams: '',
            };
          }
        }

        const analysisData: any = {
          id: a.id,
          weekStart: a.weekStart.toISOString().split('T')[0],
          weekEnd: a.weekEnd.toISOString().split('T')[0],
          general: parsedAnalysis.general,
          r2Url: a.r2Url,
          createdAt: a.createdAt,
        };

        // Premium kullanıcılar için tüm kategoriler
        if (isPremium) {
          analysisData.questions = parsedAnalysis.questions;
          analysisData.time = parsedAnalysis.time;
          analysisData.mockExams = parsedAnalysis.mockExams;
        }

        return analysisData;
      }),
    };
  }

  /**
   * Son haftalık analizi getir
   * GET /api/analytics/detailed-analysis/latest
   */
  @Get('detailed-analysis/latest')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getLatestAnalysis(@GetUser('id') userId: string) {
    // Plan kontrolü
    const { plan } = await this.pricingUsageService.getActivePlan(userId);
    const isPro = plan.code === 'pro_tier';
    const isPremium = plan.code === 'premium_tier';
    const isFree = plan.code === 'free_tier';

    // Free kullanıcılar analiz alamaz
    if (isFree) {
      throw new ForbiddenException('This feature is only available for Pro and Premium users');
    }

    if (!isPro && !isPremium) {
      throw new ForbiddenException('This feature is only available for Pro and Premium users');
    }

    const analysis = await this.analysisStorageService.getLatestAnalysis(userId);

    if (!analysis) {
      return {
        success: true,
        data: null,
        message: 'No analysis found. Weekly analysis will be generated automatically.',
      };
    }

    let parsedAnalysis: any;
    try {
      parsedAnalysis = JSON.parse(analysis.analysisText);
    } catch {
      if (analysis.categories) {
        parsedAnalysis = {
          general: analysis.categories.general || analysis.summary || analysis.analysisText,
          questions: analysis.categories.questions || '',
          time: analysis.categories.time || '',
          mockExams: analysis.categories.mockExams || '',
        };
      } else {
        parsedAnalysis = {
          general: analysis.summary || analysis.analysisText,
          questions: '',
          time: '',
          mockExams: '',
        };
      }
    }

    const responseData: any = {
      id: analysis.id,
      weekStart: analysis.weekStart.toISOString().split('T')[0],
      weekEnd: analysis.weekEnd.toISOString().split('T')[0],
      general: parsedAnalysis.general,
      r2Url: analysis.r2Url,
      createdAt: analysis.createdAt,
    };

    // Premium kullanıcılar için tüm kategoriler
    if (isPremium) {
      responseData.questions = parsedAnalysis.questions;
      responseData.time = parsedAnalysis.time;
      responseData.mockExams = parsedAnalysis.mockExams;
    }

    return {
      success: true,
      data: responseData,
    };
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
