import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MotivationQuote, QuoteCategory } from './entities/motivation-quote.entity';
import { CreateMotivationQuoteDto } from './dto/create-motivation-quote.dto';
import { UpdateMotivationQuoteDto } from './dto/update-motivation-quote.dto';
import { MotivationResultDto } from './dto/motivation-result.dto';

@Injectable()
export class MotivationService {
  constructor(
    @InjectRepository(MotivationQuote)
    private readonly motivationQuoteRepository: Repository<MotivationQuote>,
    private readonly dataSource: DataSource,
  ) {}

  // CRUD İşlemleri
  async create(createMotivationQuoteDto: CreateMotivationQuoteDto): Promise<MotivationQuote> {
    const quote = this.motivationQuoteRepository.create(createMotivationQuoteDto);
    return await this.motivationQuoteRepository.save(quote);
  }

  async findAll(): Promise<MotivationQuote[]> {
    return await this.motivationQuoteRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MotivationQuote> {
    const quote = await this.motivationQuoteRepository.findOne({ where: { id } });
    if (!quote) {
      throw new NotFoundException('Motivasyon sözü bulunamadı');
    }
    return quote;
  }

  async update(id: string, updateMotivationQuoteDto: UpdateMotivationQuoteDto): Promise<MotivationQuote> {
    const quote = await this.findOne(id);
    Object.assign(quote, updateMotivationQuoteDto);
    return await this.motivationQuoteRepository.save(quote);
  }

  async remove(id: string): Promise<void> {
    const quote = await this.findOne(id);
    await this.motivationQuoteRepository.remove(quote);
  }

  async findByCategory(category: QuoteCategory): Promise<MotivationQuote[]> {
    return await this.motivationQuoteRepository.find({
      where: { category, isActive: true },
    });
  }

  // Motivasyon Algoritması
  async getMotivationForUser(userId: string): Promise<MotivationResultDto> {
    try {
      // 1. Kullanıcının son giriş bilgisi
      const userLoginInfo = await this.dataSource.query(
        `
        SELECT 
          u.created_at,
          ll.last_login
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(created_at) as last_login
          FROM login_logs
          WHERE user_id = $1
          GROUP BY user_id
        ) ll ON u.id = ll.user_id
        WHERE u.id = $1
      `,
        [userId],
      );

      const userInfo = userLoginInfo[0];
      if (!userInfo) {
        return this.getFallbackMotivation();
      }

      const now = new Date();
      const createdAt = new Date(userInfo.created_at);
      const lastLogin = userInfo.last_login ? new Date(userInfo.last_login) : null;

      // 2. Giriş Kontrolü (Cold Start)
      const daysSinceRegistration = this.getDaysDifference(createdAt, now);
      if (daysSinceRegistration <= 1) {
        return await this.getRandomQuote(
          QuoteCategory.COLD_START,
          'Hoş Geldin! 🎉',
        );
      }

      // 3. Geri Dönüş Kontrolü (Retention)
      if (lastLogin) {
        const daysSinceLastLogin = this.getDaysDifference(lastLogin, now);
        if (daysSinceLastLogin >= 3) {
          return await this.getRandomQuote(
            QuoteCategory.INACTIVE,
            'Seni Özledik! 💙',
          );
        }
      }

      // 4. Başarı/Seri Kontrolü (Streak)
      const streakInfo = await this.dataSource.query(
        `
        SELECT 
          COUNT(DISTINCT DATE(created_at)) as consecutive_days
        FROM login_logs
        WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'
      `,
        [userId],
      );

      const consecutiveDays = parseInt(streakInfo[0]?.consecutive_days || '0', 10);
      if (consecutiveDays >= 7) {
        return await this.getRandomQuote(
          QuoteCategory.STREAK_HIGH,
          'Harika Gidiyorsun! 🔥',
        );
      }

      // 5. Başarısızlık Kontrolü (Failure)
      const recentPerformance = await this.dataSource.query(
        `
        SELECT 
          COALESCE(SUM(correct_count), 0) as correct,
          COALESCE(SUM(incorrect_count), 0) as incorrect
        FROM daily_statistics
        WHERE user_id = $1
        AND date >= CURRENT_DATE - INTERVAL '3 days'
      `,
        [userId],
      );

      const correct = parseInt(recentPerformance[0]?.correct || '0', 10);
      const incorrect = parseInt(recentPerformance[0]?.incorrect || '0', 10);
      const total = correct + incorrect;

      if (total > 10 && correct / total < 0.4) {
        return await this.getRandomQuote(
          QuoteCategory.FAILURE,
          'Pes Etme! 💪',
        );
      }

      // 6. Zaman Kontrolü (Time Context)
      const hour = now.getHours();

      if (hour >= 6 && hour <= 11) {
        return await this.getRandomQuote(
          QuoteCategory.MORNING,
          'Günaydın! ☀️',
        );
      }

      if (hour >= 23 || hour <= 4) {
        return await this.getRandomQuote(
          QuoteCategory.NIGHT,
          'İyi Çalışmalar! 🌙',
        );
      }

      // 7. Varsayılan (Fallback)
      return await this.getRandomQuote(
        QuoteCategory.GENERAL,
        'Harika Bir Gün! 🎯',
      );
    } catch (error) {
      console.error('Motivasyon algoritması hatası:', error);
      return this.getFallbackMotivation();
    }
  }

  private async getRandomQuote(
    category: QuoteCategory,
    defaultTitle: string,
  ): Promise<MotivationResultDto> {
    const quotes = await this.findByCategory(category);

    if (quotes.length === 0) {
      return {
        title: defaultTitle,
        message: 'Hedeflerine adım adım yaklaşıyorsun!',
        type: category,
      };
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    return {
      title: defaultTitle,
      message: randomQuote.content,
      type: category,
    };
  }

  private getFallbackMotivation(): MotivationResultDto {
    return {
      title: 'Başarıya Giden Yoldasın! 🚀',
      message: 'Her gün biraz daha ilerliyorsun, böyle devam et!',
      type: QuoteCategory.GENERAL,
    };
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

