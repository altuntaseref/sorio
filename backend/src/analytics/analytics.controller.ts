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
        
        // Önce categories objesini kontrol et (en güvenilir kaynak)
        if (a.categories && typeof a.categories === 'object') {
          parsedAnalysis = {
            general: a.categories.general || a.summary || a.analysisText || '',
            questions: a.categories.questions || '',
            time: a.categories.time || '',
            mockExams: a.categories.mockExams || '',
          };
        } else {
          // Categories yoksa analysisText'i parse et
          try {
            const parsed = JSON.parse(a.analysisText);
            parsedAnalysis = {
              general: parsed.general || parsed.summary || a.summary || a.analysisText || '',
              questions: parsed.questions || '',
              time: parsed.time || '',
              mockExams: parsed.mockExams || '',
            };
          } catch {
            // Parse edilemezse sadece general var
            parsedAnalysis = {
              general: a.summary || a.analysisText || '',
              questions: '',
              time: '',
              mockExams: '',
            };
          }
        }

        // weekStart ve weekEnd Date objesi değilse Date'e çevir
        const weekStart = a.weekStart instanceof Date 
          ? a.weekStart 
          : new Date(a.weekStart);
        const weekEnd = a.weekEnd instanceof Date 
          ? a.weekEnd 
          : new Date(a.weekEnd);

        // TÜM alanları her zaman response'a ekle (Premium için dolu, Pro için boş)
        const analysisData: any = {
          id: a.id,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          general: parsedAnalysis.general || '',
          questions: isPremium ? (parsedAnalysis.questions || '') : '',
          time: isPremium ? (parsedAnalysis.time || '') : '',
          mockExams: isPremium ? (parsedAnalysis.mockExams || '') : '',
          r2Url: a.r2Url,
          createdAt: a.createdAt,
        };

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
    
    // Önce categories objesini kontrol et (en güvenilir kaynak)
    if (analysis.categories && typeof analysis.categories === 'object') {
      parsedAnalysis = {
        general: analysis.categories.general || analysis.summary || analysis.analysisText || '',
        questions: analysis.categories.questions || '',
        time: analysis.categories.time || '',
        mockExams: analysis.categories.mockExams || '',
      };
    } else {
      // Categories yoksa analysisText'i parse et
      try {
        const parsed = JSON.parse(analysis.analysisText);
        parsedAnalysis = {
          general: parsed.general || parsed.summary || analysis.summary || analysis.analysisText || '',
          questions: parsed.questions || '',
          time: parsed.time || '',
          mockExams: parsed.mockExams || '',
        };
      } catch {
        // Parse edilemezse sadece general var
        parsedAnalysis = {
          general: analysis.summary || analysis.analysisText || '',
          questions: '',
          time: '',
          mockExams: '',
        };
      }
    }

    // weekStart ve weekEnd Date objesi değilse Date'e çevir
    const weekStart = analysis.weekStart instanceof Date 
      ? analysis.weekStart 
      : new Date(analysis.weekStart);
    const weekEnd = analysis.weekEnd instanceof Date 
      ? analysis.weekEnd 
      : new Date(analysis.weekEnd);

    // TÜM alanları her zaman response'a ekle (Premium için dolu, Pro için boş)
    const responseData: any = {
      id: analysis.id,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      general: parsedAnalysis.general || '',
      questions: isPremium ? (parsedAnalysis.questions || '') : '',
      time: isPremium ? (parsedAnalysis.time || '') : '',
      mockExams: isPremium ? (parsedAnalysis.mockExams || '') : '',
      r2Url: analysis.r2Url,
      createdAt: analysis.createdAt,
    };

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
