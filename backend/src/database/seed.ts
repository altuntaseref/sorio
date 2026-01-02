import { DataSource } from 'typeorm';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../subjects/entities/topic.entity';
// FIX: Changed to default import as appDataSource is a default export
import appDataSource from '../../typeorm.config';

// --- VERİ YAPISI --- //
interface ISeedTopic {
  name: string;
}

interface ISeedSubject {
  name: string;
  topics: ISeedTopic[];
}

interface ISeedExam {
  exam: 'TYT' | 'AYT' | 'LGS' | 'KPSS' | 'ALES' | 'AGS' | 'DGS' | 'YDS';
  subjects: ISeedSubject[];
}

// --- SEED VERİSİ (TAMAMI TÜRKÇE VE STRING'LER DÜZELTİLDİ) --- //
const seedData: ISeedExam[] = [
  {
    exam: 'TYT',
    subjects: [
      {
        name: 'Türkçe',
        topics: [
          { name: 'Sözcükte Anlam' },
          { name: 'Cümlede Anlam' },
          { name: 'Paragraf' },
          { name: 'Dil Bilgisi' },
          { name: 'Yazım Kuralları' },
          { name: 'Noktalama İşaretleri' },
        ],
      },
      {
        name: 'Matematik',
        topics: [
          { name: 'Temel Kavramlar' },
          { name: 'Sayı Basamakları' },
          { name: 'Bölme ve Bölünebilme' },
          { name: 'Rasyonel Sayılar' },
          { name: 'Basit Eşitsizlikler' },
          { name: 'Mutlak Değer' },
          { name: 'Üslü Sayılar' },
          { name: 'Köklü Sayılar' },
          { name: 'Problemler' },
          { name: 'Fonksiyonlar' },
          { name: 'Kümeler' },
          { name: 'Permütasyon ve Kombinasyon' },
          { name: 'Olasılık' },
        ],
      },
      {
        name: 'Fizik',
        topics: [
          { name: 'Fizik Bilimine Giriş' },
          { name: 'Madde ve Özellikleri' },
          { name: 'Hareket ve Kuvvet' },
          { name: 'İş, Güç ve Enerji' },
          { name: 'Isı ve Sıcaklık' },
          { name: 'Elektrostatik' },
          { name: 'Elektrik ve Manyetizma' },
          { name: 'Basınç ve Kaldırma Kuvveti' },
          { name: 'Dalgalar' },
          { name: 'Optik' },
        ],
      },
      {
        name: 'Kimya',
        topics: [
          { name: 'Kimya Bilimi' },
          { name: 'Atom ve Periyodik Sistem' },
          { name: 'Kimyasal Türler Arası Etkileşimler' },
          { name: 'Maddenin Halleri' },
          { name: 'Asitler, Bazlar ve Tuzlar' },
          { name: 'Karışımlar' },
          { name: 'Kimyanın Temel Kanunları' },
        ],
      },
      {
        name: 'Biyoloji',
        topics: [
          { name: 'Canlıların Ortak Özellikleri' },
          { name: 'Canlıların Temel Bileşenleri' },
          { name: 'Hücre ve Organelleri' },
          { name: 'Canlılar Dünyası' },
          { name: 'Kalıtım' },
          { name: 'Ekosistem Ekolojisi' },
        ],
      },
      {
        name: 'Tarih',
        topics: [
          { name: 'Tarih ve Zaman' },
          { name: 'İnsanlığın İlk Dönemleri' },
          { name: "Orta Çağ'da Dünya" },
          { name: 'İlk ve Orta Çağlarda Türk Dünyası' },
          { name: 'İslam Medeniyetinin Doğuşu' },
          { name: "Türklerin İslamiyet'i Kabulü ve İlk Türk İslam Devletleri" },
        ],
      },
      {
        name: 'Coğrafya',
        topics: [
          { name: 'Doğa ve İnsan Etkileşimi' },
          { name: 'Harita Bilgisi' },
          { name: 'Coğrafi Konum' },
          { name: 'Dünyanın Şekli ve Hareketleri' },
          { name: 'İklim Bilgisi' },
          { name: "Türkiye'nin İklimi" },
          { name: 'İç ve Dış Kuvvetler' },
        ],
      },
      {
        name: 'Felsefe',
        topics: [
          { name: 'Felsefeye Giriş' },
          { name: 'Bilgi Felsefesi (Epistemoloji)' },
          { name: 'Varlık Felsefesi (Ontoloji)' },
          { name: 'Ahlak Felsefesi (Etik)' },
          { name: 'Siyaset Felsefesi' },
        ],
      },
    ],
  },
  {
    exam: 'AYT',
    subjects: [
      {
        name: 'Matematik',
        topics: [
          { name: 'Polinomlar' },
          { name: 'İkinci Dereceden Denklemler' },
          { name: 'Parabol' },
          { name: 'Eşitsizlikler' },
          { name: 'Trigonometri' },
          { name: 'Logaritma' },
          { name: 'Diziler' },
          { name: 'Limit ve Süreklilik' },
          { name: 'Türev ve Uygulamaları' },
          { name: 'İntegral' },
        ],
      },
      {
        name: 'Edebiyat',
        topics: [
          { name: 'Edebiyata Giriş' },
          { name: 'Şiir Bilgisi' },
          { name: 'İslamiyet Öncesi Türk Edebiyatı' },
          { name: 'Halk Edebiyatı' },
          { name: 'Divan Edebiyatı' },
          { name: 'Tanzimat Dönemi Edebiyatı' },
          { name: 'Servet-i Fünun Edebiyatı' },
          { name: 'Milli Edebiyat' },
          { name: 'Cumhuriyet Dönemi Edebiyatı' },
        ],
      },
      {
        name: 'Fizik',
        topics: [
          { name: 'Vektörler ve Kuvvet' },
          { name: 'Tork ve Denge' },
          { name: 'Kütle Merkezi' },
          { name: 'Basit Makineler' },
          { name: "Dinamik ve Newton'un Hareket Yasaları" },
          { name: 'Çembersel Hareket' },
          { name: 'Basit Harmonik Hareket' },
          { name: 'Dalga Mekaniği' },
          { name: 'Elektrik ve Manyetizma' },
          { name: 'Modern Fizik' },
        ],
      },
      {
        name: 'Kimya',
        topics: [
          { name: 'Modern Atom Teorisi' },
          { name: 'Gazlar' },
          { name: 'Sıvı Çözeltiler ve Çözünürlük' },
          { name: 'Kimyasal Tepkimelerde Enerji' },
          { name: 'Kimyasal Tepkimelerde Hız' },
          { name: 'Kimyasal Denge' },
          { name: 'Organik Kimyaya Giriş' },
          { name: 'Organik Kimya' },
        ],
      },
      {
        name: 'Biyoloji',
        topics: [
          { name: 'Sinir Sistemi' },
          { name: 'Endokrin Sistem' },
          { name: 'Duyu Organları' },
          { name: 'Destek ve Hareket Sistemi' },
          { name: 'Sindirim Sistemi' },
          { name: 'Dolaşım ve Bağışıklık Sistemi' },
          { name: 'Solunum Sistemi' },
          { name: 'Boşaltım Sistemi' },
          { name: 'Bitki Biyolojisi' },
          { name: 'Canlılarda Enerji Dönüşümleri' },
        ],
      },
      {
        name: 'Tarih-1/2',
        topics: [
          { name: 'Beylikten Devlete Osmanlı' },
          { name: 'Dünya Gücü Osmanlı' },
          { name: 'Yeni Çağ Avrupası' },
          { name: 'Yakın Çağ Avrupası' },
          { name: "Osmanlı'da Islahatlar" },
          { name: '20. Yüzyıl Başlarında Osmanlı' },
          { name: 'Milli Mücadele' },
          { name: 'Atatürkçülük ve Türk İnkılabı' },
        ],
      },
      {
        name: 'Coğrafya-1/2',
        topics: [
          { name: 'Biyoçeşitlilik ve Ekosistem' },
          { name: 'Nüfus Politikaları' },
          { name: 'Türkiye Ekonomisi' },
          { name: "Türkiye'nin Coğrafi Konumu ve Jeopolitiği" },
          { name: 'Bölgeler ve Ülkeler' },
          { name: 'Çevre ve Toplum' },
        ],
      },
    ],
  },
  {
    exam: 'LGS',
    subjects: [
      {
        name: 'Türkçe',
        topics: [
          { name: 'Fiilimsiler' },
          { name: 'Cümlenin Öğeleri' },
          { name: 'Söz Sanatları' },
          { name: 'Metin Türleri' },
        ],
      },
      {
        name: 'Matematik',
        topics: [
          { name: 'Çarpanlar ve Katlar' },
          { name: 'Üslü İfadeler' },
          { name: 'Kareköklü İfadeler' },
          { name: 'Veri Analizi' },
          { name: 'Olasılık' },
        ],
      },
      {
        name: 'Fen Bilimleri',
        topics: [
          { name: 'Mevsimler ve İklim' },
          { name: 'DNA ve Genetik Kod' },
          { name: 'Basınç' },
          { name: 'Madde ve Endüstri' },
        ],
      },
      {
        name: 'T.C. İnkılap Tarihi ve Atatürkçülük',
        topics: [
          { name: 'Bir Kahraman Doğuyor' },
          { name: 'Milli Uyanış' },
          { name: 'Ya İstiklal Ya Ölüm!' },
        ],
      },
      { name: 'Din Kültürü ve Ahlak Bilgisi', topics: [{ name: 'Kader İnancı' }, { name: 'Zekat ve Sadaka' }] },
      { name: 'İngilizce', topics: [{ name: 'Friendship' }, { name: 'Teen Life' }, { name: 'In the Kitchen' }] },
    ],
  },
  {
    exam: 'KPSS',
    subjects: [
        { name: 'Genel Yetenek - Türkçe', topics: [{name: 'Sözel Mantık'}, {name: 'Paragraf'}]},
        { name: 'Genel Yetenek - Matematik', topics: [{name: 'Sayısal Mantık'}, {name: 'Problemler'}]},
        { name: 'Genel Kültür - Tarih', topics: [{name: 'İslamiyet Öncesi Türk Tarihi'}, {name: 'Osmanlı Tarihi'}, {name: 'İnkılap Tarihi'}]},
        { name: 'Genel Kültür - Coğrafya', topics: [{name: "Türkiye'nin Fiziki Coğrafyası"}, {name: "Türkiye'nin Beşeri Coğrafyası"}]},
        { name: 'Genel Kültür - Vatandaşlık', topics: [{name: 'Temel Hukuk Kavramları'}, {name: 'Anayasa Hukuku'}]},
        { name: 'Eğitim Bilimleri', topics: [{name: 'Gelişim Psikolojisi'}, {name: 'Öğrenme Psikolojisi'}, {name: 'Ölçme ve Değerlendirme'}, {name: 'Rehberlik'}]},
    ],
  },
  {
    exam: 'ALES',
    subjects: [
      { name: 'Sayısal', topics: [{ name: 'Sayısal Mantık' }, { name: 'Geometri' }, { name: 'Sayısal Akıl Yürütme' }] },
      { name: 'Sözel', topics: [{ name: 'Sözel Mantık' }, { name: 'Paragraf Analizi' }, { name: 'Sözel Akıl Yürütme' }] },
    ],
  },
  {
    exam: 'AGS',
    subjects: [
        { name: 'Sayısal Yetenek', topics: [{name: 'Matematiksel İlişkiler'}, {name: 'Sayısal Problem Çözme'}]},
        { name: 'Sözel Yetenek', topics: [{name: 'Sözel Akıl Yürütme (Mantık)'}, {name: 'Türkçeyi Doğru Kullanma'}]},
        { name: 'Tarih', topics: [{name: 'Genel Türk Tarihi'}, {name: 'Türkiye Cumhuriyeti Tarihi'}]},
        { name: 'Türkiye Coğrafyası', topics: [{name: 'Fiziki Coğrafya'}, {name: 'Beşeri ve Ekonomik Coğrafya'}]},
        { name: 'Temel Hukuk ve Mevzuat', topics: [{name: "Anayasa'nın Genel Esasları"}, {name: 'Devlet Teşkilatı'}, {name: 'Temel Kanunlar'}]},
        { name: 'Eğitimin Temelleri ve Türk Milli Eğitim Sistemi', topics: [{name: 'Eğitim Sosyolojisi'}, {name: 'Türk Eğitim Tarihi'}, {name: 'Eğitim Politikası'}]},
    ]
  },
  {
    exam: 'DGS',
    subjects: [
        { name: 'Sayısal', topics: [{name: 'Temel Matematik'}, {name: 'Sayısal Mantık Problemleri'}] },
        { name: 'Sözel', topics: [{name: 'Sözel Akıl Yürütme'}, {name: 'Paragraf Yorumlama'}] },
    ],
  },
  {
    exam: 'YDS',
    subjects: [
      { name: 'İngilizce', topics: [{ name: 'Kelime Bilgisi (Vocabulary)' }, { name: 'Gramer (Grammar)' }, { name: 'Çeviri (Translation)' }, { name: 'Okuma Parçaları (Reading)' }, { name: 'Cloze Test' }] },
    ],
  },
];

// --- SEEDER FONKSİYONU --- //

const seed = async (dataSource: DataSource) => {
  console.log('🌱 Veritabanı seed işlemi başlıyor...');

  const subjectRepository = dataSource.getRepository(Subject);
  const topicRepository = dataSource.getRepository(Topic);

  for (const examData of seedData) {
    const { exam, subjects } = examData;
    console.log(`\n🎯 [${exam}] sınavı için işlem yapılıyor...`);

    for (const subjectData of subjects) {
      // 1. Dersin mevcut olup olmadığını kontrol et (exam_target ve name ile)
      let subject = await subjectRepository.findOne({
        where: {
          examTarget: exam,
          name: subjectData.name,
          isSystem: true,
        },
      });

      // 2. Ders mevcut değilse oluştur
      if (!subject) {
        subject = subjectRepository.create({
          name: subjectData.name,
          examTarget: exam,
          isSystem: true,
          userId: null, // Sistem dersi olduğu için user_id null
        });
        await subjectRepository.save(subject);
        console.log(`  ✅ [${exam}] -> "${subject.name}" dersi oluşturuldu.`);
      } else {
        console.log(`  ➖ [${exam}] -> "${subject.name}" dersi zaten mevcut, atlanıyor.`);
      }

      // 3. Dersin konularını işle
      for (const topicData of subjectData.topics) {
        // Konunun mevcut olup olmadığını kontrol et (subject_id ve name ile)
        const topic = await topicRepository.findOne({
          where: {
            name: topicData.name,
            subject: { id: subject.id }, // Relation ile kontrol
          },
        });

        // Konu mevcut değilse oluştur
        if (!topic) {
          const newTopic = topicRepository.create({
            name: topicData.name,
            subject: subject,
          });
          await topicRepository.save(newTopic);
          console.log(`    - "${newTopic.name}" konusu eklendi.`);
        } else {
            // Konu zaten varsa loglamaya gerek yok, konsolu kalabalık yapmasın.
        }
      }
    }
  }
  console.log('\n✨ Seed işlemi başarıyla tamamlandı!');
};

// --- SCRİPTİ ÇALIŞTIR --- //

const runSeed = async () => {
  let dataSource: DataSource | null = null;
  try {
    // Initialize data source
    dataSource = await appDataSource.initialize();
    // Run seeder
    await seed(dataSource);
  } catch (error) {
    console.error('❌ Seed işlemi sırasında bir hata oluştu:', error);
    process.exit(1);
  } finally {
    // Destroy connection and exit process
    if (dataSource) {
      await dataSource.destroy();
    }
    process.exit(0);
  }
};

runSeed();
