import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAnalysis } from '../entities/user-analysis.entity';
import { R2Service } from '../../upload/r2.service';

@Injectable()
export class DetailedAnalysisStorageService {
  private readonly logger = new Logger(DetailedAnalysisStorageService.name);

  constructor(
    @InjectRepository(UserAnalysis)
    private userAnalysisRepository: Repository<UserAnalysis>,
    private r2Service: R2Service,
  ) {}

  /**
   * Analizi veritabanına kaydet (ve opsiyonel olarak R2'ye)
   */
  async saveAnalysis(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
    analysis: { general: string; questions: string; time: string; mockExams: string },
    dataSummary: any,
    saveToR2 = false,
  ): Promise<UserAnalysis> {
    let r2Key: string | undefined;
    let r2Url: string | undefined;

    // JSON formatında analiz metni
    const analysisText = JSON.stringify(analysis);

    // R2'ye kaydet (opsiyonel)
    if (saveToR2) {
      try {
        const fileName = `analyses/${userId}/${weekStart.toISOString().split('T')[0]}-analysis.json`;
        const uploadResult = await this.r2Service.uploadText(
          fileName,
          analysisText,
          'application/json',
        );
        r2Key = uploadResult.key;
        r2Url = uploadResult.url;
        this.logger.log(`Analysis saved to R2: ${r2Key}`);
      } catch (error) {
        this.logger.error('Failed to save analysis to R2', error);
        // R2 kaydetme başarısız olsa bile DB'ye kaydet
      }
    }

    // Veritabanına kaydet
    const userAnalysis = this.userAnalysisRepository.create({
      userId,
      weekStart,
      weekEnd,
      analysisText,
      summary: analysis.general, // GENEL analizi summary olarak kaydet
      categories: {
        general: analysis.general,
        questions: analysis.questions,
        time: analysis.time,
        mockExams: analysis.mockExams,
      },
      dataSummary,
      r2Key,
      r2Url,
    });

    const saved = await this.userAnalysisRepository.save(userAnalysis);
    this.logger.log(`Analysis saved to database for user ${userId}, week ${weekStart}`);

    return saved;
  }

  /**
   * Kullanıcının belirli bir hafta için analizini getir
   */
  async getAnalysisByWeek(
    userId: string,
    weekStart: Date,
  ): Promise<UserAnalysis | null> {
    return this.userAnalysisRepository.findOne({
      where: { userId, weekStart },
    });
  }

  /**
   * Kullanıcının son analizini getir
   */
  async getLatestAnalysis(userId: string): Promise<UserAnalysis | null> {
    return this.userAnalysisRepository.findOne({
      where: { userId },
      order: { weekStart: 'DESC' },
    });
  }

  /**
   * Kullanıcının tüm analizlerini getir
   */
  async getAllAnalyses(userId: string): Promise<UserAnalysis[]> {
    return this.userAnalysisRepository.find({
      where: { userId },
      order: { weekStart: 'DESC' },
    });
  }

  /**
   * Bu hafta için analiz var mı kontrol et
   */
  async hasAnalysisForWeek(userId: string, weekStart: Date): Promise<boolean> {
    const count = await this.userAnalysisRepository.count({
      where: { userId, weekStart },
    });
    return count > 0;
  }

  /**
   * Bu hafta için analiz var mı ve ne zaman oluşturulmuş kontrol et
   * Eğer varsa analizi döndür, yoksa null döndür
   */
  async getOrCheckAnalysisForWeek(
    userId: string,
    weekStart: Date,
  ): Promise<UserAnalysis | null> {
    return this.userAnalysisRepository.findOne({
      where: { userId, weekStart },
    });
  }

  /**
   * Kullanıcının son N gün içinde analiz oluşturup oluşturmadığını kontrol et
   * (Ekstra güvenlik için - haftalık limit kontrolü)
   */
  async hasRecentAnalysis(userId: string, days: number = 7): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);

    // Son oluşturulan analizin tarihini kontrol et
    const latest = await this.userAnalysisRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!latest) {
      return false;
    }

    // Son analiz, cutoffDate'den sonra mı oluşturulmuş?
    return latest.createdAt >= cutoffDate;
  }

  /**
   * Kullanıcının bu ay içinde kaç analiz oluşturduğunu kontrol et
   * Aylık limit: 4 analiz
   */
  async getMonthlyAnalysisCount(userId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Bu ay içinde oluşturulmuş analizleri say
    const count = await this.userAnalysisRepository
      .createQueryBuilder('analysis')
      .where('analysis.userId = :userId', { userId })
      .andWhere('analysis.createdAt >= :monthStart', { monthStart })
      .andWhere('analysis.createdAt <= :monthEnd', { monthEnd })
      .getCount();

    return count;
  }

  /**
   * Aylık limit kontrolü (4 analiz/ay)
   */
  async canCreateAnalysisThisMonth(userId: string): Promise<boolean> {
    const monthlyCount = await this.getMonthlyAnalysisCount(userId);
    return monthlyCount < 4;
  }
}
