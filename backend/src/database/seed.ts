import { DataSource } from 'typeorm';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
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
