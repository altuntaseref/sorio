export class WeeklyAnalysisResponseDto {
  general: string; // GENEL - Derin analiz (özet + diğer alanları içeren, 500-700 kelime)
  questions: string; // SORULAR - Soru çözme analizi, ders bazlı performans, konu bazlı detay (bir paragraf, 200-300 kelime)
  time: string; // ZAMAN - Zaman analizi (bir paragraf, 200-300 kelime)
  mockExams: string; // DENEMELER - Deneme sınavları analizi (bir paragraf, 200-300 kelime)
}

export class WeeklyAnalysisFullResponseDto {
  success: boolean;
  data: {
    id: string;
    weekStart: string;
    weekEnd: string;
    summary: string;
    categories: {
      overview?: string | null;
      time?: string | null;
      questions?: string | null;
      subjects?: string | null;
      topics?: string | null;
      exams?: string | null;
      mastery?: string | null;
      habits?: string | null;
      comparison?: string | null;
      strengths?: string | null;
      improvements?: string | null;
      recommendations?: string | null;
    };
    savedAt: Date;
    isExisting?: boolean;
    message?: string;
  };
}
