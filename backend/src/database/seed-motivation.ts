import { DataSource } from 'typeorm';
import { QuoteCategory } from '../motivation/entities/motivation-quote.entity';

export async function seedMotivationQuotes(dataSource: DataSource) {
  console.log('🌱 Motivasyon sözleri seed işlemi başlıyor...');

  const motivationQuotes = [
    // GENERAL - Genel Motivasyon (15 adet)
    {
      content: 'Hedeflerine adım adım yaklaşıyorsun, böyle devam et!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Her soru bir adım, her adım bir hedefe!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Başarı, küçük çabaların tekrarıdır.',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Bugün dünden daha iyisin, yarın bugünden daha iyi olacaksın!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Bilgi güçtür, sen de her gün daha güçleniyorsun!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Sınava hazırlık bir maraton, her gün biraz daha ilerle!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Hayallerinin peşinden koşmaya devam et!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'En büyük zafer, kendini geçmektir. Sen başarıyorsun!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Her çözülen soru, hayaline bir adım daha yakın!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Başarı tesadüf değil, kararlılıktır. Sen kararlısın!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Öğrenmek asla bitmez, her gün yeni bir şey öğren!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Zorluklar seni durduramaz, sadece güçlendirir!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Bugün bir günü daha kazandın, değerlendirmeyi unutma!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'Hedefe giden yolda her adımın değerli!',
      category: QuoteCategory.GENERAL,
    },
    {
      content: 'İmkansız diye bir şey yok, sadece çabalamayan var!',
      category: QuoteCategory.GENERAL,
    },

    // MORNING - Sabah Motivasyonu (10 adet)
    {
      content: 'Günaydın! Bugün harika bir gün olacak! ☀️',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Sabah erken kalk, hedeflerine erken ulaş!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Güne taze bir zihinle başla, daha verimli çalış!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Sabah çalışması akşam yorgunluğunu bilmez!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Günaydın şampiyon! Bugün de bir şeyler öğreneceksin!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Her sabah yeni bir başlangıçtır, bugün de harika başla!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Sabahın erken saatleri zihin için altındır!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Güne konsantre başla, başarı yakında!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Sabah çalışması, akşam rahatlığı getirir!',
      category: QuoteCategory.MORNING,
    },
    {
      content: 'Günaydın! Bugün hangi konuları fethediceksin?',
      category: QuoteCategory.MORNING,
    },

    // NIGHT - Gece Motivasyonu (10 adet)
    {
      content: 'Gece kuşları da başarıya uçar! 🌙',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Gece sessizliği zihin berraklığı getirir!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Herkes uyurken sen çalışıyorsun, bu farkı yaratır!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Gece çalışması seni bir adım öne çıkarır!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Ama uykunu almayı unutma, dinlenme de önemli!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Gece saatlerinde çalışmak cesaret ister, sen cesaretlisin!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Yıldızlar altında çalışmak romantik, ama yorma kendini!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Gece çalışırken sağlığını da düşün, molaları unutma!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Sessizlik konsantrasyonu artırır, iyi çalışmalar!',
      category: QuoteCategory.NIGHT,
    },
    {
      content: 'Gece çalışması güzel ama uyku da şart, dengele!',
      category: QuoteCategory.NIGHT,
    },

    // STREAK_HIGH - Seri Yüksek (10 adet)
    {
      content: 'Alev alıyorsun! 🔥 Zinciri kırma!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Son 7 gündür aralıksız çalışıyorsun, inanılmaz!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Düzenlilik başarının anahtarı, sen anahtarı buldun!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Seriyi sürdürmek zor, ama sen başarıyorsun!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Bu tempo ile hedefe ulaşman an meselesi!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Günlük çalışma serileri seni diğerlerinden ayırır!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Disiplinin ödülünü göreceksin, devam et!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Böyle gidersen hiçbir şey seni durduramaz!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Kararlılığın seni zirveye taşıyacak!',
      category: QuoteCategory.STREAK_HIGH,
    },
    {
      content: 'Seri devam ediyor, sen de devam et!',
      category: QuoteCategory.STREAK_HIGH,
    },

    // INACTIVE - Uzun Süre Gelmeyenler (10 adet)
    {
      content: 'Seni özledik! Hadi tekrar başlayalım! 💙',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Geri dönmen harika! Şimdi kaldığın yerden devam et!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Ara vermek iyidir ama dönmek daha iyi!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Hoş geldin! Hedeflerine ulaşmak için hala zamanın var!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Düşmek yenilgi değil, kalkmamak yenilgidir. Sen kaktın!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Yeniden başlamak cesaret ister, sen cesaretlisin!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Her gün yeni bir fırsat, bugün yeniden başla!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Geç kalmak yoktur, önemli olan devam etmek!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Seni burada görmek güzel, hadi çalışmaya başla!',
      category: QuoteCategory.INACTIVE,
    },
    {
      content: 'Mola bitti, şimdi gaz verme zamanı!',
      category: QuoteCategory.INACTIVE,
    },

    // FAILURE - Başarısızlık/Düşük Performans (10 adet)
    {
      content: 'Pes etmek yok! Her hata bir ders! 💪',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Yanlış yapmak öğrenmenin bir parçası, devam et!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Başarısızlık sona değil, başlangıca yakınsın!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Hatalardan ders al, tekrar et, başar!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Düşmek ayıp değil, kalkmamak ayıp. Hadi ayağa kalk!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Her yanlış, doğruya giden yolda bir adımdır!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Moralini bozmana izin verme, sen yapabilirsin!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Zorluklarla karşılaşmak seni daha güçlü yapar!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Başarı, başarısızlıktan vazgeçmemektir!',
      category: QuoteCategory.FAILURE,
    },
    {
      content: 'Bu geçici, başarı kalıcı olacak, inan kendine!',
      category: QuoteCategory.FAILURE,
    },

    // COLD_START - İlk Giriş (10 adet)
    {
      content: 'Hoş geldin! Başarıya giden yolculuğun başlıyor! 🎉',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Seni aramızda görmek harika! Hadi başlayalım!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Yeni bir başlangıç, yeni bir umut! Hazır mısın?',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'İlk adımı attın, bu çok önemli! Devam et!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Hoş geldin! Burada harika bir yolculuk seni bekliyor!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Başlamak her şeyin yarısıdır, sen başladın bile!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Yeni yolculuğuna hoş geldin! Başarı yakında!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'İlk günün harika geçecek, hazır ol!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Sen de başarı hikayelerinden biri olacaksın!',
      category: QuoteCategory.COLD_START,
    },
    {
      content: 'Hoş geldin! Hayal ettiğin gelecek seni bekliyor!',
      category: QuoteCategory.COLD_START,
    },
  ];

  try {
    for (const quote of motivationQuotes) {
      await dataSource.query(
        `
        INSERT INTO motivation_quotes (content, category, is_active)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `,
        [quote.content, quote.category, true],
      );
    }

    console.log(`✅ ${motivationQuotes.length} motivasyon sözü başarıyla eklendi!`);
  } catch (error) {
    console.error('❌ Motivasyon sözleri seed işlemi başarısız:', error);
    throw error;
  }
}

