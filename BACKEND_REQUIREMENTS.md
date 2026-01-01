# Soru Defterim - Backend Requirements Dokümantasyonu

## Genel Bakış

Bu dokümantasyon, Soru Defterim mobil uygulaması için NestJS (TypeScript) backend'inin detaylı gereksinimlerini içermektedir. Backend, güvenli, ölçeklenebilir ve performanslı olacak şekilde tasarlanmalıdır.

---

## Teknoloji Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Railway veya Supabase)
- **Storage**: Cloudflare R2 (Resim depolama)
- **Authentication**: JWT (JSON Web Tokens)
- **OAuth**: Google & Apple Sign-In
- **Hosting**: Railway

---

## 1. Authentication & Authorization

### 1.1. Kullanıcı Kayıt (Register)

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```typescript
{
  email: string;              // Email ile kayıt
  password: string;          // Minimum 8 karakter, güçlü şifre
  passwordConfirm: string;    // Şifre tekrarı
  firstName: string;          // Ad
  lastName: string;           // Soyad
  examTarget?: string;        // Opsiyonel: YKS, LYS, vb. (dropdown'dan)
  provider?: 'google' | 'apple' | 'email'; // OAuth provider
  providerId?: string;        // OAuth provider ID (Google/Apple için)
}
```

**Validasyonlar**:
- Email format kontrolü
- Şifre güçlülük kontrolü (min 8 karakter, büyük/küçük harf, rakam)
- Şifre ve şifre tekrarı eşleşme kontrolü
- Email benzersizlik kontrolü
- Ad ve soyad zorunlu alanlar

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      examTarget?: string;
    };
    accessToken: string;
    refreshToken: string;
  }
}
```

**Database Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL olabilir (OAuth için)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT, -- Profil fotoğrafı URL (OAuth provider'dan veya kullanıcı yüklediği)
  exam_target VARCHAR(50), -- YKS, LYS, vb.
  provider VARCHAR(20) DEFAULT 'email', -- 'email', 'google', 'apple'
  provider_id VARCHAR(255), -- OAuth provider ID
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2. Kullanıcı Giriş (Login)

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```typescript
{
  email: string;
  password: string; // OAuth için gerekli değil
  provider?: 'google' | 'apple' | 'email';
}
```

**Validasyonlar**:
- Email ve şifre kontrolü
- Kullanıcı aktif mi kontrolü

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      examTarget?: string;
    };
    accessToken: string;
    refreshToken: string;
  }
}
```

**Giriş Tarihi Kaydı**:
```sql
CREATE TABLE login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

### 1.3. OAuth Authentication

**Google Sign-In Endpoint**: `POST /api/auth/google`
**Apple Sign-In Endpoint**: `POST /api/auth/apple`

**Request Body**:
```typescript
{
  idToken: string; // Google/Apple ID Token
  provider: 'google' | 'apple';
}
```

**İşlem Akışı**:
1. ID Token doğrulama
2. Provider'dan kullanıcı bilgileri çekme
3. Kullanıcı yoksa kayıt, varsa giriş
4. JWT token oluşturma

### 1.4. JWT Token Yönetimi

- **Access Token**: 15 dakika geçerlilik (kısa süreli)
- **Refresh Token**: 7 gün geçerlilik (uzun süreli)
- **Token Refresh Endpoint**: `POST /api/auth/refresh`

**Refresh Token Storage**:
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.5. Authorization Middleware

- Tüm protected endpoint'lerde JWT token kontrolü
- User ID'yi request'ten çıkarıp kullanıcı verilerine erişim sağlama
- Role-based access control (gelecekte admin için)

### 1.6. Hesap Silme (Delete Account)

**Endpoint**: `DELETE /api/users/me`

**Validasyonlar**:
- Kullanıcı authentication kontrolü
- Kullanıcının aktif hesabının olması

**İşlem Akışı**:
1. Kullanıcı authentication kontrolü
2. Kullanıcıya ait tüm verileri silme (CASCADE DELETE):
   - Questions (ve R2'deki resimler)
   - Quiz sessions ve answers
   - Question statistics
   - Daily statistics
   - User subjects ve topics
   - Login logs
   - Refresh tokens
3. Kullanıcı hesabını silme
4. İlgili R2'deki tüm resimleri silme (batch delete)

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Önemli Notlar**:
- Bu işlem geri alınamaz (irreversible)
- Apple App Store gereksinimi (hesap oluşturma özelliği olan uygulamalar için zorunlu)
- GDPR/KVKK uyumu için gerekli
- Tüm kullanıcı verileri cascade delete ile otomatik silinir

---

## 2. Ders ve Konu Yönetimi

### 2.1. Varsayılan Dersler ve Konular

**Endpoint**: `GET /api/subjects/default?examTarget=YKS`

**Response**:
```typescript
{
  success: boolean;
  data: {
    subjects: Array<{
      id: string;
      name: string;
      examTarget: string;
      isSystem: boolean;
      topics: Array<{
        id: string;
        name: string;
        subjectId: string;
      }>;
    }>;
  }
}
```

**Not**: Unified table yapısı kullanıldığı için sistem dersleri `is_system = true` ile filtrelenir.

**Database Schema**:
```sql
-- Unified Subjects Table (Sistem ve kullanıcı dersleri tek tabloda)
-- 1. Önce Tabloyu Oluştur (Unique Constraintler olmadan)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  exam_target VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Check Constraint burada kalabilir, bu geçerlidir
  CONSTRAINT check_subject_type CHECK (
    (is_system = true AND user_id IS NULL AND exam_target IS NOT NULL) OR
    (is_system = false AND user_id IS NOT NULL AND exam_target IS NULL)
  )
);

-- 2. Kullanıcı dersleri için benzersizlik kuralını İNDEKS olarak ekle
-- (Sadece kullanıcı dersleri için isim benzersiz olmalı)
CREATE UNIQUE INDEX idx_unique_user_subjects 
ON subjects(user_id, name) 
WHERE user_id IS NOT NULL;

-- 3. Sistem dersleri için benzersizlik kuralını İNDEKS olarak ekle
-- (Sadece sistem dersleri için exam_target + isim benzersiz olmalı)
CREATE UNIQUE INDEX idx_unique_system_subjects 
ON subjects(exam_target, name) 
WHERE is_system = true;

-- 4. Topics tablosu (Burada WHERE olmadığı için constraint içinde kalabilir)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subject_id, name) -- Standart unique constraint, burada sorun yok
);

-- 5. Performans İndeksleri
CREATE INDEX idx_subjects_user_id ON subjects(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_subjects_exam_target ON subjects(exam_target) WHERE is_system = true;
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
```

**Önemli Notlar**:
- **Unified Table Yapısı**: Sistem ve kullanıcı dersleri tek tabloda tutulur
- **Foreign Key**: `questions.subject_id` artık `subjects.id`'ye doğrudan FK ile bağlanabilir
- **Cascade Delete**: Ders silindiğinde altındaki konular ve sorular otomatik silinir
- **Check Constraint**: Sistem derslerinde `user_id` NULL, kullanıcı derslerinde `exam_target` NULL olmalı
- **Unique Constraints**: Kullanıcılar kendi derslerinde aynı ismi iki kez kullanamaz

### 2.2. Kullanıcı Özel Ders Ekleme

**Endpoint**: `POST /api/subjects`

**Request Body**:
```typescript
{
  name: string; // Ders adı
}
```

**Validasyonlar**:
- Ders adı zorunlu
- Aynı kullanıcı aynı dersi iki kez ekleyemez
- Minimum 2 karakter
- `user_id` authentication token'dan alınır

**Response**:
```typescript
{
  success: boolean;
  data: {
    subject: {
      id: string;
      name: string;
      userId: string;
      isSystem: boolean;
      createdAt: string;
    };
  }
}
```

**Not**: Unified table yapısında kullanıcı dersleri `is_system = false` ve `user_id = current_user_id` ile kaydedilir.

### 2.3. Kullanıcı Özel Konu Ekleme

**Endpoint**: `POST /api/subjects/:subjectId/topics`

**Request Body**:
```typescript
{
  name: string; // Konu adı
}
```

**Validasyonlar**:
- Konu adı zorunlu
- Subject ID'nin kullanıcıya ait olduğu kontrolü (user_id kontrolü veya sistem dersi ise erişim kontrolü)
- Aynı ders altında aynı konu iki kez eklenemez

**Response**:
```typescript
{
  success: boolean;
  data: {
    topic: {
      id: string;
      name: string;
      subjectId: string;
      createdAt: string;
    };
  }
}
```

### 2.4. Kullanıcının Tüm Derslerini ve Konularını Getirme

**Endpoint**: `GET /api/subjects?examTarget=YKS`

**Query Parameters**:
- `examTarget` (opsiyonel): Belirli bir sınav hedefi için sistem derslerini filtreleme

**Response**:
```typescript
{
  success: boolean;
  data: {
    systemSubjects: Array<{
      id: string;
      name: string;
      examTarget: string;
      isSystem: boolean;
      topics: Array<{
        id: string;
        name: string;
      }>;
    }>;
    customSubjects: Array<{
      id: string;
      name: string;
      userId: string;
      isSystem: boolean;
      topics: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }
}
```

**Güvenlik**: 
- Sistem dersleri: Kullanıcının `exam_target`'ına göre filtrelenir
- Kullanıcı dersleri: Sadece kullanıcının kendi derslerini (`user_id = current_user_id`) görebilir

**Not**: Unified table yapısı sayesinde tek bir sorgu ile hem sistem hem kullanıcı dersleri getirilir.

---

## 3. Soru Yönetimi

### 3.1. Soru Kaydetme

**Endpoint**: `POST /api/questions`

**Request Body** (application/json):
```typescript
{
  questionImageUrl: string;      // Soru fotoğrafı URL (presigned URL ile yüklendikten sonra alınan publicUrl)
  questionImageKey: string;      // R2'deki dosya key'i (silme için)
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'; // Doğru cevap (zorunlu)
  solutionNote?: string;         // Çözüm notu (opsiyonel)
  solutionImageUrl?: string;     // Çözüm fotoğrafı URL (opsiyonel, presigned URL ile yüklendikten sonra)
  solutionImageKey?: string;     // Çözüm fotoğrafı R2 key'i (opsiyonel)
  subjectId: string;             // Ders ID (zorunlu)
  topicId: string;               // Konu ID (zorunlu)
  name?: string;                 // Soru adı (opsiyonel)
  aiSolution?: string;           // AI çözümü (opsiyonel)
}
```

**İşlem Akışı**:
1. Kullanıcı authentication kontrolü
2. Subject ve Topic'in kullanıcıya ait olduğu veya sistem dersi olduğu kontrolü
3. Database'e soru kaydı (resimler zaten R2'de)

**Önemli Not**: 
- Resimler presigned URL yöntemi ile önceden R2'ye yüklenmiş olmalıdır
- Mobil uygulama önce `/api/upload/presigned-url` endpoint'inden presigned URL alır
- Dosyayı direkt R2'ye yükler
- Sonra bu endpoint'e `questionImageUrl` ve `questionImageKey` bilgilerini gönderir

**Database Schema**:
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, -- Unified subjects table
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,     -- Unified topics table
  name VARCHAR(200),        -- Opsiyonel soru adı
  question_image_url TEXT NOT NULL, -- Cloudflare R2 URL
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
  solution_note TEXT,      -- Çözüm notu
  solution_image_url TEXT, -- Çözüm fotoğrafı URL
  ai_solution TEXT,        -- AI çözümü
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index'ler performans için
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_subject_topic ON questions(subject_id, topic_id);
CREATE INDEX idx_questions_created_at ON questions(created_at);
```

**Önemli Not**: 
- Unified table yapısı sayesinde `subject_id` ve `topic_id` artık doğrudan Foreign Key ile bağlanabilir
- Cascade delete çalışır: Ders veya konu silindiğinde ilgili sorular otomatik silinir
- Veri bütünlüğü garantilidir

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    question: {
      id: string;
      name?: string;
      questionImageUrl: string;
      correctAnswer: string;
      solutionNote?: string;
      solutionImageUrl?: string;
      aiSolution?: string;
      subjectId: string;
      topicId: string;
      createdAt: string;
    };
  }
}
```

### 3.2. Soruları Listeleme

**Endpoint**: `GET /api/questions?subjectId=xxx&topicId=yyy&page=1&limit=20`

**Query Parameters**:
- `subjectId` (opsiyonel): Belirli bir derse göre filtreleme
- `topicId` (opsiyonel): Belirli bir konuya göre filtreleme
- `page` (default: 1): Sayfa numarası
- `limit` (default: 20): Sayfa başına kayıt sayısı

**Response**:
```typescript
{
  success: boolean;
  data: {
    questions: Array<{
      id: string;
      name?: string;
      questionImageUrl: string;
      correctAnswer: string;
      solutionNote?: string; // İlk 100 karakter
      solutionImageUrl?: string;
      subjectName: string;
      topicName: string;
      createdAt: string;
      stats: {
        totalAttempts: number;
        correctCount: number;
        incorrectCount: number;
        lastAttemptedAt?: string;
      };
      badges: {
        isMastered: boolean;      // 10+ kez doğru yapılmış
        hasNoErrors: boolean;     // Hiç hata yapılmamış
        hasSomeErrors: boolean;   // Hata sayısı yarıdan az
        hasManyErrors: boolean;   // Hata sayısı yarıdan fazla
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
}
```

**Güvenlik**: Sadece kullanıcının kendi sorularını görebilir.

### 3.3. Soru Detayı Getirme

**Endpoint**: `GET /api/questions/:id`

**Response**:
```typescript
{
  success: boolean;
  data: {
    question: {
      id: string;
      name?: string;
      questionImageUrl: string;
      correctAnswer: string;
      solutionNote?: string; // Tam metin
      solutionImageUrl?: string;
      aiSolution?: string;
      subjectId: string;
      subjectName: string;
      topicId: string;
      topicName: string;
      createdAt: string;
      updatedAt: string;
      stats: {
        totalAttempts: number;
        correctCount: number;
        incorrectCount: number;
        lastAttemptedAt?: string;
      };
    };
  }
}
```

**Güvenlik**: Sorunun kullanıcıya ait olduğu kontrol edilir.

### 3.4. Soru Güncelleme

**Endpoint**: `PUT /api/questions/:id`

**Request Body** (application/json):
```typescript
{
  questionImageUrl?: string;     // Yeni soru fotoğrafı URL (presigned URL ile yüklendikten sonra)
  questionImageKey?: string;     // Yeni soru fotoğrafı R2 key'i
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | 'E';
  solutionNote?: string;
  solutionImageUrl?: string;     // Yeni çözüm fotoğrafı URL (presigned URL ile yüklendikten sonra)
  solutionImageKey?: string;     // Yeni çözüm fotoğrafı R2 key'i
  subjectId?: string;
  topicId?: string;
  name?: string;
  aiSolution?: string;
}
```

**Validasyonlar**:
- Sorunun kullanıcıya ait olduğu kontrolü
- Yeni subject/topic'in kullanıcıya ait olduğu veya sistem dersi olduğu kontrolü
- Eski resimlerin R2'den silinmesi (yeni resim URL/key'i gönderilirse)

**İşlem Akışı**:
1. Yeni resim URL/key'i gönderildiyse, eski resmin key'ini kaydet
2. Database'i güncelle
3. Eski resimleri R2'den sil (async olarak yapılabilir)

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    question: {
      // Güncellenmiş soru bilgileri
    };
  }
}
```

### 3.5. Soru Silme

**Endpoint**: `DELETE /api/questions/:id`

**İşlem Akışı**:
1. Sorunun kullanıcıya ait olduğu kontrolü
2. R2'den resimlerin silinmesi
3. Database'den soru ve ilişkili kayıtların silinmesi (cascade)

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 4. Quiz ve Alıştırma Sistemi

### 4.1. Quiz Başlatma

**Endpoint**: `POST /api/quiz/start`

**Request Body**:
```typescript
{
  mode: 'learning' | 'wrong-answers'; // Öğrenme veya Yanlış yaptıklarım
  subjectIds: string[];              // Seçilen dersler
  topicIds: string[];                // Seçilen konular
}
```

**Validasyonlar**:
- Subject ve Topic'lerin kullanıcıya ait olduğu kontrolü
- En az bir subject veya topic seçilmiş olmalı
- "wrong-answers" modunda kullanıcının yanlış yaptığı sorular olmalı

**Response**:
```typescript
{
  success: boolean;
  data: {
    quizId: string;
    totalQuestions: number;
    questions: Array<{
      id: string;
      questionImageUrl: string;
      // Cevap bilgisi gösterilmez
    }>;
  }
}
```

**Database Schema**:
```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('learning', 'wrong-answers')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0
);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer CHAR(1) CHECK (user_answer IN ('A', 'B', 'C', 'D', 'E')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2. Quiz Cevabı Gönderme

**Endpoint**: `POST /api/quiz/:quizId/answer`

**Request Body**:
```typescript
{
  questionId: string;
  userAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
}
```

**İşlem Akışı**:
1. Quiz session'ın kullanıcıya ait olduğu kontrolü
2. Sorunun doğru cevabını kontrol etme
3. Cevabı kaydetme
4. Quiz session istatistiklerini güncelleme
5. Soru istatistiklerini güncelleme

**Response**:
```typescript
{
  success: boolean;
  data: {
    isCorrect: boolean;
    correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
    stats: {
      totalAnswered: number;
      correctCount: number;
      incorrectCount: number;
    };
  }
}
```

### 4.3. Quiz Tamamlama

**Endpoint**: `POST /api/quiz/:quizId/complete`

**Response**:
```typescript
{
  success: boolean;
  data: {
    quizId: string;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number; // Yüzde olarak
    completedAt: string;
  }
}
```

### 4.4. Soru İstatistikleri

**Database Schema**:
```sql
CREATE TABLE question_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP,
  UNIQUE(user_id, question_id)
);
```

**Badge Hesaplama Mantığı**:
- **Güç Sembolü (Mastered)**: `total_attempts >= 10`
- **Hiç Hata Yok**: `incorrect_count === 0 && total_attempts > 0`
- **Hata Yarıdan Az**: `incorrect_count < (total_attempts / 2) && incorrect_count > 0`
- **Hata Yarıdan Fazla**: `incorrect_count >= (total_attempts / 2) && incorrect_count > 0`

**Gelecek Özellik - Spaced Repetition (SRS) Algoritması**:
- Soru çözme sistemine spaced repetition algoritması eklenebilir
- `question_statistics` tablosuna `next_review_date` (TIMESTAMP) alanı eklenebilir
- Algoritma: Doğru yapılan sorular daha uzun aralıklarla, yanlış yapılan sorular daha kısa aralıklarla tekrar sorulur
- Bu özellik V1.1 veya V1.2 versiyonunda eklenebilir

---

## 5. Analiz ve İstatistikler

### 5.1. Genel İstatistikler

**Endpoint**: `GET /api/analytics/overview`

**Response**:
```typescript
{
  success: boolean;
  data: {
    totalQuestionsSolved: number;
    totalCorrect: number;
    totalIncorrect: number;
    overallAccuracy: number; // Yüzde
    totalQuestionsAdded: number;
    weeklyActivity: Array<{
      week: string; // "2024-W01" formatında
      questionsSolved: number;
      correctCount: number;
      incorrectCount: number;
      isRecordWeek: boolean; // En iyi hafta mı?
    }>;
    subjectBreakdown: Array<{
      subjectId: string;
      subjectName: string;
      questionsSolved: number;
      correctCount: number;
      incorrectCount: number;
      accuracy: number;
    }>;
  }
}
```

**Database Schema**:
```sql
-- Günlük istatistikler
CREATE TABLE daily_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  questions_solved INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Haftalık aktivite için materialized view
CREATE MATERIALIZED VIEW weekly_activity AS
SELECT 
  user_id,
  DATE_TRUNC('week', date) as week_start,
  SUM(questions_solved) as total_solved,
  SUM(correct_count) as total_correct,
  SUM(incorrect_count) as total_incorrect
FROM daily_statistics
GROUP BY user_id, DATE_TRUNC('week', date);

-- Index materialized view üzerinde
CREATE INDEX idx_weekly_activity_user_week ON weekly_activity(user_id, week_start);
```

**Materialized View Refresh Stratejisi**:
- Materialized view'lar otomatik güncellenmez, manuel refresh gerekir
- **Önerilen yaklaşım**: Her yeni `daily_statistics` kaydından sonra ilgili hafta için refresh yapılmalı
- **Alternatif yaklaşım**: Cron job ile saatte bir veya günde bir `REFRESH MATERIALIZED VIEW weekly_activity` çalıştırılabilir
- **Performance**: Eğer çok sık refresh gerekiyorsa, materialized view yerine normal view kullanılabilir (performans maliyeti ile güncellik arasında trade-off)

### 5.2. Haftalık Aktivite Grafiği

**Endpoint**: `GET /api/analytics/weekly-activity?weeks=12`

**Query Parameters**:
- `weeks` (default: 12): Kaç haftalık veri gösterilecek

**Response**:
```typescript
{
  success: boolean;
  data: {
    weeks: Array<{
      week: string;
      weekStart: string;
      weekEnd: string;
      questionsSolved: number;
      correctCount: number;
      incorrectCount: number;
      accuracy: number;
      isRecordWeek: boolean;
    }>;
    recordWeek: {
      week: string;
      questionsSolved: number;
    } | null;
  }
}
```

**Rekor Hafta Hesaplama**: En çok soru çözülen hafta rekor hafta olarak işaretlenir.

### 5.3. Ders Bazlı İstatistikler

**Endpoint**: `GET /api/analytics/subjects`

**Response**:
```typescript
{
  success: boolean;
  data: {
    subjects: Array<{
      subjectId: string;
      subjectName: string;
      totalQuestions: number;      // Bu dersten toplam soru sayısı
      questionsSolved: number;     // Çözülen soru sayısı
      correctCount: number;
      incorrectCount: number;
      accuracy: number;
    }>;
  }
}
```

---

## 6. Cloudflare R2 Entegrasyonu

### 6.1. Presigned URL Alındıktan Sonra Resim Yükleme

**Endpoint**: `GET /api/upload/presigned-url`

**Query Parameters**:
- `fileName`: string (zorunlu) - Dosya adı (örn: "question-123.jpg")
- `fileType`: string (zorunlu) - Dosya tipi: 'question' | 'solution'
- `contentType`: string (opsiyonel) - MIME type (örn: "image/jpeg"). Belirtilmezse dosya adından çıkarılır

**Validasyonlar**:
- Dosya tipi kontrolü (jpg, jpeg, png, webp)
- Dosya adı format kontrolü
- Kullanıcı authentication kontrolü

**Response**:
```typescript
{
  success: boolean;
  data: {
    uploadUrl: string;    // Presigned URL - Mobil uygulama bu URL'e PUT request ile dosyayı yükler
    publicUrl: string;    // Resmin public erişim URL'i (soru kaydetmede kullanılacak)
    key: string;          // R2'deki dosya key'i (silme için)
    expiresIn: number;    // Presigned URL'in geçerlilik süresi (saniye cinsinden, genelde 15 dakika)
  }
}
```

**İşlem Akışı**:
1. Mobil uygulama dosyayı seçer
2. Backend'den presigned URL ister (fileName, fileType gönderir)
3. Backend Cloudflare R2'de presigned URL oluşturur
4. Mobil uygulama dosyayı **direkt R2'ye** PUT request ile yükler (presigned URL'e)
5. Mobil uygulama soru kaydetme endpoint'ine `publicUrl` ve `key` bilgisini gönderir

**Avantajlar**:
- ✅ Sunucuya dosya gelmez (CPU/RAM tasarrufu)
- ✅ Railway bandwidth kotasından tasarruf (sadece presigned URL response'u gider)
- ✅ Daha hızlı upload (direkt R2'ye)
- ✅ Node.js single-thread tıkanması riski yok
- ✅ Ölçeklenebilir çözüm

**Mobil Uygulama Tarafı (Örnek)**:
```typescript
// 1. Presigned URL al
const { uploadUrl, publicUrl, key } = await getPresignedUrl(fileName, fileType);

// 2. Dosyayı direkt R2'ye yükle
await fetch(uploadUrl, {
  method: 'PUT',
  body: fileBlob,
  headers: {
    'Content-Type': contentType
  }
});

// 3. Soru kaydet (publicUrl ve key'i gönder)
await createQuestion({
  questionImageUrl: publicUrl,
  // ... diğer alanlar
});
```

### 6.2. Resim Silme

**Endpoint**: `DELETE /api/upload/image?key=xxx`

**Query Parameters**:
- `key`: string (zorunlu) - R2'deki dosya key'i

**Validasyonlar**:
- Key format kontrolü
- Dosyanın kullanıcıya ait olduğu kontrolü (opsiyonel, güvenlik için)

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**İşlem**: R2'den dosyayı silme (backend tarafından)

---

## 7. Güvenlik Gereksinimleri

### 7.1. Authentication & Authorization

- Tüm protected endpoint'lerde JWT token kontrolü
- Her request'te kullanıcı ID'si doğrulanmalı
- Kullanıcı sadece kendi verilerine erişebilir

### 7.2. Data Isolation

- Tüm database sorgularında `user_id` filtresi zorunlu
- Foreign key constraint'lerde `ON DELETE CASCADE` kullanılmalı
- Row-level security (RLS) kontrolü (Supabase kullanılıyorsa)

### 7.3. Input Validation

- Tüm input'lar NestJS ValidationPipe ile validate edilmeli
- SQL injection koruması (TypeORM/Prisma kullanılmalı)
- XSS koruması
- File upload güvenliği (dosya tipi, boyut kontrolü)

### 7.4. Rate Limiting

- Login endpoint'lerinde rate limiting (5 deneme/dakika)
- API endpoint'lerinde genel rate limiting
- File upload rate limiting

### 7.5. CORS

- Sadece mobil uygulama domain'lerine izin verilmeli
- Production ve development için ayrı CORS ayarları

### 7.6. Environment Variables

- Tüm hassas bilgiler environment variable'larda tutulmalı
- `.env.example` dosyası oluşturulmalı
- Production'da secret management kullanılmalı

---

## 8. Database Migration Stratejisi

### 8.1. Migration Dosyaları

- TypeORM veya Prisma migration kullanılmalı
- Her migration dosyası versiyonlanmalı
- Rollback stratejisi hazır olmalı

### 8.2. Seed Data

- Varsayılan dersler ve konular için seed data
- Development ortamı için test kullanıcıları

---

## 9. Error Handling

### 9.1. Standart Error Response Formatı

```typescript
{
  success: false;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
}
```

### 9.2. HTTP Status Kodları

- `200`: Başarılı
- `201`: Oluşturuldu
- `400`: Bad Request (validation hatası)
- `401`: Unauthorized (token yok/geçersiz)
- `403`: Forbidden (yetki yok)
- `404`: Not Found
- `409`: Conflict (duplicate kayıt)
- `500`: Internal Server Error

### 9.3. Logging

- Tüm hatalar loglanmalı
- Production'da sensitive data loglanmamalı
- Winston veya benzeri logging library kullanılmalı

---

## 10. Performance Optimizasyonları

### 10.1. Database Indexing

- `user_id` üzerinde index'ler
- `subject_id`, `topic_id` üzerinde composite index'ler
- `created_at` üzerinde index'ler (sıralama için)

### 10.2. Pagination

- Tüm listeleme endpoint'lerinde pagination zorunlu
- Default limit: 20, max limit: 100

### 10.3. Caching

- Varsayılan dersler ve konular cache'lenebilir
- Redis kullanılabilir (opsiyonel)

### 10.4. Image Optimization

- Resimler yüklenirken optimize edilmeli
- Thumbnail oluşturulabilir
- Lazy loading için farklı boyutlar

---

## 11. API Documentation

### 11.1. Swagger/OpenAPI

- Swagger UI entegrasyonu
- Tüm endpoint'ler dokümante edilmeli
- Request/Response örnekleri

---

## 12. Testing Requirements

### 12.1. Unit Tests

- Service layer testleri
- Utility function testleri
- Minimum %70 code coverage

### 12.2. Integration Tests

- API endpoint testleri
- Database integration testleri
- Authentication flow testleri

### 12.3. E2E Tests

- Kritik user flow'ları test edilmeli

---

## 13. Deployment Checklist

### 13.1. Railway Deployment

- Environment variables ayarlanmalı
- Database connection string
- Cloudflare R2 credentials
- JWT secret keys
- OAuth client IDs ve secrets

### 13.2. Database Setup

- Production database oluşturulmalı
- Migration'lar çalıştırılmalı
- Seed data yüklenmeli (varsayılan dersler)

### 13.3. Monitoring

- Error tracking (Sentry veya benzeri)
- Application performance monitoring
- Database query monitoring

---

## 14. API Endpoint Özeti

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple` - Apple OAuth
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış
- `DELETE /api/users/me` - Hesap silme (Apple Store gereksinimi)

### Subjects & Topics
- `GET /api/subjects` - Tüm dersler ve konular (sistem + kullanıcı dersleri)
- `GET /api/subjects/default` - Varsayılan dersler
- `POST /api/subjects` - Özel ders ekleme
- `POST /api/subjects/:id/topics` - Konu ekleme
- `PUT /api/subjects/:id` - Ders güncelleme
- `DELETE /api/subjects/:id` - Ders silme

### Questions
- `GET /api/questions` - Soruları listeleme
- `GET /api/questions/:id` - Soru detayı
- `POST /api/questions` - Soru ekleme
- `PUT /api/questions/:id` - Soru güncelleme
- `DELETE /api/questions/:id` - Soru silme

### Quiz
- `POST /api/quiz/start` - Quiz başlatma
- `POST /api/quiz/:id/answer` - Cevap gönderme
- `POST /api/quiz/:id/complete` - Quiz tamamlama
- `GET /api/quiz/:id` - Quiz detayı

### Analytics
- `GET /api/analytics/overview` - Genel istatistikler
- `GET /api/analytics/weekly-activity` - Haftalık aktivite
- `GET /api/analytics/subjects` - Ders bazlı istatistikler

### Upload
- `GET /api/upload/presigned-url` - Presigned URL alma (resimleri direkt R2'ye yüklemek için)
- `DELETE /api/upload/image` - Resim silme

---

## 15. Önemli Notlar

1. **Data Privacy**: Hiçbir kullanıcı başka bir kullanıcının verisini göremez. Tüm sorgularda `user_id` filtresi zorunludur.

2. **Unified Subjects Table**: Sistem ve kullanıcı dersleri tek tabloda tutulur (`subjects`). Bu sayede Foreign Key constraint'leri düzgün çalışır ve cascade delete garantilidir.

3. **Presigned URL Yöntemi**: Resimler direkt Cloudflare R2'ye yüklenir. Sunucuya gelmez, bu sayede CPU/RAM tasarrufu ve Railway bandwidth kotası tasarrufu sağlanır.

4. **Materialized View Refresh**: `weekly_activity` materialized view'ı manuel refresh gerektirir. Her yeni `daily_statistics` kaydından sonra veya cron job ile düzenli refresh yapılmalıdır.

5. **Apple Store Gereksinimi**: Hesap oluşturma özelliği olan uygulamalar için hesap silme özelliği zorunludur (`DELETE /api/users/me`).

6. **Soft Delete**: İsterseniz sorular için soft delete implementasyonu yapılabilir (deleted_at kolonu).

7. **Backup Strategy**: Düzenli database backup'ları alınmalı.

8. **Scalability**: Gelecekte artan kullanıcı sayısı için hazırlıklı olunmalı (database sharding, caching, CDN).

9. **AI Integration**: AI çözüm özelliği için harici bir AI servisi entegrasyonu gerekebilir (OpenAI, vb.).

10. **Gelecek Özellikler**: 
    - Spaced Repetition (SRS) algoritması (V1.1)
    - Force Update / Version Control endpoint (V1.1)

---

Bu dokümantasyon, backend geliştirme sürecinde referans olarak kullanılmalı ve gerektiğinde güncellenmelidir.

