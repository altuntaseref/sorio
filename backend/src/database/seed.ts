import { DataSource } from 'typeorm';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
// FIX: Changed to default import as appDataSource is a default export
import appDataSource from '../../typeorm.config';
import { seedMotivationQuotes } from './seed-motivation';

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

async function runSeed() {
  try {
    await appDataSource.initialize();
    console.log('📦 Database bağlantısı başarılı!');

    // Motivasyon sözlerini seed et
    await seedMotivationQuotes(appDataSource);

    console.log('✅ Tüm seed işlemleri tamamlandı!');
    await appDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed işlemi sırasında hata oluştu:', error);
    await appDataSource.destroy();
    process.exit(1);
  }
}

// Script direkt çalıştırıldığında seed'i başlat
if (require.main === module) {
  runSeed();
}
