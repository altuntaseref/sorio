import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DetailedAnalysisDataService } from './detailed-analysis-data.service';
import { WeeklyAnalysisResponseDto } from '../dto/weekly-analysis-response.dto';

@Injectable()
export class DetailedAnalysisAiService {
  private readonly logger = new Logger(DetailedAnalysisAiService.name);
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private promptTemplate: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataService: DetailedAnalysisDataService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.modelName =
      this.configService.get<string>('OPENAI_MODEL_NAME') || 'gpt-4o';

    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }

    this.logger.log(`Using OpenAI model: ${this.modelName}`);

    // Load prompt template
    this.loadPromptTemplate();
  }

  private loadPromptTemplate() {
    try {
      const promptPath = path.join(
        process.cwd(),
        'src',
        'analytics',
        'prompts',
        'detailed-analysis.prompt.txt',
      );
      if (fs.existsSync(promptPath)) {
        const fileContent = fs.readFileSync(promptPath, 'utf-8').trim();

        // Try to parse as JSON first (for structured prompts)
        try {
          const parsed = JSON.parse(fileContent);
          if (parsed.content) {
            this.promptTemplate = parsed.content;
          } else {
            this.promptTemplate = fileContent;
          }
        } catch {
          // If not JSON, use as plain text
          this.promptTemplate = fileContent;
        }
      } else {
        // Fallback prompt
        this.promptTemplate = `Sen öğrencilere detaylı performans analizi yapan uzman bir eğitim danışmanısın. Öğrencinin tüm çalışma verilerini analiz edip kapsamlı bir rapor hazırla.`;
        this.logger.warn('Prompt file not found, using default prompt');
      }
    } catch (error) {
      this.logger.error('Failed to load prompt template', error);
      this.promptTemplate =
        'Sen öğrencilere detaylı performans analizi yapan uzman bir eğitim danışmanısın.';
    }
  }

  async generateDetailedAnalysis(
    userId: string,
    weeklyComparison = false,
    isPremium = true, // Premium kullanıcılar için tüm kategoriler, Pro için sadece GENEL
  ): Promise<{ analysis: WeeklyAnalysisResponseDto; dataSummary: any; scenario: any }> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      let userData: any;
      let dataSummary: any;
      let scenario: any = null;

      if (weeklyComparison) {
        // Haftalık analiz: Önceki hafta ile karşılaştırma
        this.logger.log(
          `Collecting weekly comparison data for user ${userId}...`,
        );
        const comparisonData =
          await this.dataService.collectWeeklyDataWithComparison(userId);
        userData = comparisonData;
        scenario = comparisonData.scenario;
        dataSummary = {
          currentWeek: comparisonData.currentWeek.summary,
          previousWeek: comparisonData.previousWeek.summary,
          weekStart: comparisonData.currentWeek.weekStart,
          weekEnd: comparisonData.currentWeek.weekEnd,
          scenario,
        };
      } else {
        // Genel analiz
        this.logger.log(`Collecting data for user ${userId}...`);
        userData = await this.dataService.collectUserData(userId);
        dataSummary = userData.summary;
      }

      // Verileri optimize et (token tasarrufu için)
      const optimizedData = this.optimizeDataForAI(userData, weeklyComparison);

      // Kullanıcı adını ekle (AI'ya göndermek için)
      const userName = weeklyComparison
        ? userData.currentWeek?.user?.firstName || userData.previousWeek?.user?.firstName || null
        : userData.user?.firstName || null;

      const userInfo = userName 
        ? `\n\nKULLANICI BİLGİSİ:\nKullanıcının adı: ${userName}\nAnalizde kullanıcıya ismiyle hitap et.`
        : '';

      // Senaryo bilgisini ekle
      const scenarioInfo = scenario 
        ? `\n\nSENARYO BİLGİSİ:\n${JSON.stringify(scenario, null, 2)}`
        : '';

      // Premium kontrolü: Pro kullanıcılar için sadece GENEL, Premium için tüm kategoriler
      const analysisType = isPremium ? 'full' : 'general_only';
      const analysisInstruction = isPremium
        ? `MUTLAKA geçerli JSON formatında yanıt ver: { "general": "...", "questions": "...", "time": "...", "mockExams": "..." }
- GENEL: Derin ve kapsamlı analiz (500-700 kelime). Tüm alanları içermeli.
- SORULAR: Bir paragraf (200-300 kelime). Soru çözme, ders bazlı, konu bazlı.
- ZAMAN: Bir paragraf (200-300 kelime). Çalışma süreleri, dağılım, trend.
- DENEMELER: Bir paragraf (200-300 kelime). Deneme sınavları analizi.`
        : `MUTLAKA geçerli JSON formatında yanıt ver: { "general": "...", "questions": "", "time": "", "mockExams": "" }
- GENEL: Derin ve kapsamlı analiz (500-700 kelime). Tüm alanları içermeli.
- SORULAR: Boş string bırak (Pro kullanıcılar için bu kategori yok).
- ZAMAN: Boş string bırak (Pro kullanıcılar için bu kategori yok).
- DENEMELER: Boş string bırak (Pro kullanıcılar için bu kategori yok).`;

      // OpenAI API'ye istek gönder
      const requestBody = {
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: this.promptTemplate,
          },
          {
            role: 'user',
            content: weeklyComparison
              ? `Aşağıda öğrencinin bu hafta ve önceki hafta çalışma verileri JSON formatında verilmiştir. Bu verileri karşılaştırarak detaylıca analiz et ve MUTLAKA aşağıdaki JSON formatında rapor hazırla.

KRİTİK: Response'un MUTLAKA şu 4 alanı içermesi gerekiyor:
{
  "general": "...",      // GENEL analizi (500-700 kelime)
  "questions": "...",    // SORULAR analizi (200-300 kelime) - SORU ÇÖZME ile ilgili her şey
  "time": "...",        // ZAMAN analizi (200-300 kelime) - ÇALIŞMA SÜRELERİ ile ilgili her şey
  "mockExams": "..."    // DENEMELER analizi (200-300 kelime) - DENEME SINAVLARI ile ilgili her şey
}

ÖNEMLİ: 
- Önceki hafta verileri ile bu hafta verilerini karşılaştır.
- Gelişim trendlerini, artış/azalışları, iyileşme alanlarını belirle.
${analysisInstruction}
- Veri yoksa mevcut verilerle analiz yap ve eksiklikleri belirt.
- TÜM 4 ALANI MUTLAKA DOLDUR. Hiçbir alan boş kalmamalı.

ÖĞRENCİ VERİLERİ (Bu Hafta ve Önceki Hafta):
${JSON.stringify(optimizedData, null, 2)}${scenarioInfo}${userInfo}

Lütfen bu verileri analiz edip YUKARIDAKİ JSON FORMATINDA (4 alan: general, questions, time, mockExams) performans raporu hazırla.`
              : `Aşağıda öğrencinin tüm çalışma verileri JSON formatında verilmiştir. Bu verileri detaylıca analiz et ve MUTLAKA aşağıdaki JSON formatında rapor hazırla.

KRİTİK: Response'un MUTLAKA şu 4 alanı içermesi gerekiyor:
{
  "general": "...",      // GENEL analizi (500-700 kelime)
  "questions": "...",    // SORULAR analizi (200-300 kelime) - SORU ÇÖZME ile ilgili her şey
  "time": "...",        // ZAMAN analizi (200-300 kelime) - ÇALIŞMA SÜRELERİ ile ilgili her şey
  "mockExams": "..."    // DENEMELER analizi (200-300 kelime) - DENEME SINAVLARI ile ilgili her şey
}

ÖNEMLİ:
${analysisInstruction}
- Veri yoksa mevcut verilerle analiz yap ve eksiklikleri belirt.
- TÜM 4 ALANI MUTLAKA DOLDUR. Hiçbir alan boş kalmamalı.

ÖĞRENCİ VERİLERİ:
${JSON.stringify(optimizedData, null, 2)}${scenarioInfo}${userInfo}

Lütfen bu verileri analiz edip YUKARIDAKİ JSON FORMATINDA (4 alan: general, questions, time, mockExams) performans raporu hazırla.`,
          },
        ],
        response_format: { type: 'json_object' }, // JSON mode
        max_tokens: 4000,
        temperature: 0.7,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `OpenAI API error: ${response.status} - ${errorText}`,
        );
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      let analysisText = data.choices[0].message.content;

      // AI'dan gelen response'u log'la (ilk 500 karakter)
      this.logger.log('AI response (first 500 chars):', analysisText.substring(0, 500));

      // JSON parse et
      let analysis: WeeklyAnalysisResponseDto;
      try {
        // Eğer markdown code block içindeyse temizle
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(analysisText);
        
        // Parse edilen objeyi log'la
        this.logger.log('Parsed JSON keys:', Object.keys(parsed));
        
        // Response formatını kontrol et ve düzelt
        analysis = {
          general: parsed.general || parsed.summary || '',
          questions: parsed.questions || '',
          time: parsed.time || '',
          mockExams: parsed.mockExams || '',
        };

        // Eğer categories objesi varsa, ondan al
        if (parsed.categories && typeof parsed.categories === 'object') {
          analysis.questions = parsed.categories.questions || analysis.questions || '';
          analysis.time = parsed.categories.time || analysis.time || '';
          analysis.mockExams = parsed.categories.mockExams || analysis.mockExams || '';
        }

        this.logger.log('Final analysis structure:', {
          hasGeneral: !!analysis.general,
          generalLength: analysis.general?.length || 0,
          hasQuestions: !!analysis.questions,
          questionsLength: analysis.questions?.length || 0,
          hasTime: !!analysis.time,
          timeLength: analysis.time?.length || 0,
          hasMockExams: !!analysis.mockExams,
          mockExamsLength: analysis.mockExams?.length || 0,
        });

        // Eğer sadece general varsa ve diğerleri boşsa, uyarı ver
        if (analysis.general && !analysis.questions && !analysis.time && !analysis.mockExams) {
          this.logger.warn('AI returned only general analysis. Other fields are empty. This may indicate the AI did not follow the format.');
          // Eğer isPremium ise, boş alanlar için teşvik edici mesajlar ekle
          if (isPremium) {
            if (!analysis.questions || analysis.questions.trim() === '') {
              analysis.questions = 'Henüz yeterli soru çözme verisi toplayamadık. Daha fazla soru çözdükçe bu analiz daha detaylı olacak. Hadi başlayalım!';
            }
            if (!analysis.time || analysis.time.trim() === '') {
              analysis.time = 'Henüz yeterli çalışma süresi verisi toplayamadık. Düzenli çalışma yaptıkça zaman analizlerin daha anlamlı hale gelecek.';
            }
            if (!analysis.mockExams || analysis.mockExams.trim() === '') {
              analysis.mockExams = 'Henüz deneme sınavı kaydedilmemiş. Deneme sınavı sonuçlarını kaydettikçe sınav performansını daha iyi analiz edebiliriz.';
            }
          }
        }
      } catch (parseError) {
        this.logger.error('Failed to parse AI response as JSON', parseError);
        this.logger.error('Response content:', analysisText.substring(0, 500));
        // Fallback: Eski format
        analysis = {
          general: this.cleanMarkdown(analysisText),
          questions: '',
          time: '',
          mockExams: '',
        };
      }

      // Analizi temizle (markdown varsa)
      if (analysis.general) {
        analysis.general = this.cleanMarkdown(analysis.general);
      }
      if (analysis.questions) {
        analysis.questions = this.cleanMarkdown(analysis.questions);
      }
      if (analysis.time) {
        analysis.time = this.cleanMarkdown(analysis.time);
      }
      if (analysis.mockExams) {
        analysis.mockExams = this.cleanMarkdown(analysis.mockExams);
      }

      // Pro kullanıcılar için sadece GENEL, diğerleri boş
      if (!isPremium) {
        analysis.questions = '';
        analysis.time = '';
        analysis.mockExams = '';
      }

      // Tüm alanların string olduğundan emin ol
      analysis.general = analysis.general || '';
      analysis.questions = analysis.questions || '';
      analysis.time = analysis.time || '';
      analysis.mockExams = analysis.mockExams || '';

      this.logger.log(`Analysis generated successfully for user ${userId}`);
      return { analysis, dataSummary, scenario };
    } catch (error) {
      this.logger.error('Error generating detailed analysis', error);
      throw error;
    }
  }

  /**
   * Veriyi AI için optimize et (token tasarrufu)
   */
  private optimizeDataForAI(userData: any, weeklyComparison: boolean): any {
    if (weeklyComparison) {
      // Sadece önemli verileri gönder
      return {
        currentWeek: {
          user: userData.currentWeek.user,
          summary: userData.currentWeek.summary,
          studySessions: userData.currentWeek.studySessions?.slice(0, 20) || [],
          quizSessions: userData.currentWeek.quizSessions?.slice(0, 20) || [],
          subjectPerformance: userData.currentWeek.subjectPerformance || [],
          topicPerformance: userData.currentWeek.topicPerformance?.slice(0, 20) || [],
          examCodePerformance: userData.currentWeek.examCodePerformance || [],
          dailyStats: userData.currentWeek.dailyStats || [],
          mockExams: userData.currentWeek.mockExams || [],
          masteryDistribution: userData.currentWeek.masteryDistribution || [],
        },
        previousWeek: {
          user: userData.previousWeek.user,
          summary: userData.previousWeek.summary,
          studySessions: userData.previousWeek.studySessions?.slice(0, 10) || [],
          quizSessions: userData.previousWeek.quizSessions?.slice(0, 10) || [],
          subjectPerformance: userData.previousWeek.subjectPerformance || [],
          topicPerformance: userData.previousWeek.topicPerformance?.slice(0, 10) || [],
          examCodePerformance: userData.previousWeek.examCodePerformance || [],
          dailyStats: userData.previousWeek.dailyStats || [],
          mockExams: userData.previousWeek.mockExams || [],
          masteryDistribution: userData.previousWeek.masteryDistribution || [],
        },
      };
    } else {
      return {
        user: userData.user,
        summary: userData.summary,
        studySessions: userData.studySessions?.slice(0, 30) || [],
        quizSessions: userData.quizSessions?.slice(0, 30) || [],
        subjectPerformance: userData.subjectPerformance || [],
        topicPerformance: userData.topicPerformance?.slice(0, 30) || [],
        examCodePerformance: userData.examCodePerformance || [],
        dailyStats: userData.dailyStats || [],
        masteryDistribution: userData.masteryDistribution || [],
        mockExams: userData.mockExams || [],
      };
    }
  }

  /**
   * Removes markdown formatting and converts to plain text
   */
  private cleanMarkdown(text: string): string {
    // Remove markdown headers
    text = text.replace(/^#{1,6}\s+/gm, '');
    // Remove bold/italic
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    // Remove links
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove horizontal rules
    text = text.replace(/^---$/gm, '');
    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  }
}
