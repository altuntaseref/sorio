# Soru Defterim - Entity Relationship (ER) Diagram

Bu dokümantasyon, Soru Defterim uygulamasının veritabanı şemasının ER diagramını içermektedir.

## Mermaid ER Diagram

```mermaid
erDiagram
    users ||--o{ login_logs : "has"
    users ||--o{ refresh_tokens : "has"
    users ||--o{ subjects : "creates"
    users ||--o{ questions : "owns"
    users ||--o{ quiz_sessions : "starts"
    users ||--o{ question_statistics : "tracks"
    users ||--o{ daily_statistics : "has"
    
    subjects ||--o{ topics : "has"
    
    questions }o--|| users : "belongs to"
    questions }o--|| subjects : "belongs to"
    questions }o--|| topics : "belongs to"
    questions ||--o{ quiz_answers : "answered in"
    questions ||--o{ question_statistics : "has stats"
    
    quiz_sessions ||--o{ quiz_answers : "contains"
    quiz_sessions }o--|| users : "belongs to"
    
    quiz_answers }o--|| quiz_sessions : "belongs to"
    quiz_answers }o--|| questions : "for"
    
    question_statistics }o--|| users : "belongs to"
    question_statistics }o--|| questions : "for"
    
    daily_statistics }o--|| users : "belongs to"

    users {
        uuid id PK
        varchar email UK "UNIQUE, NOT NULL"
        varchar password_hash "NULL for OAuth"
        varchar first_name "NOT NULL"
        varchar last_name "NOT NULL"
        text avatar_url "Profil fotoğrafı URL"
        varchar exam_target "YKS, LYS, etc."
        varchar provider "email, google, apple"
        varchar provider_id "OAuth provider ID"
        boolean is_active "DEFAULT true"
        timestamp created_at
        timestamp updated_at
    }
    
    login_logs {
        uuid id PK
        uuid user_id FK "NOT NULL"
        timestamp login_at "DEFAULT NOW()"
        varchar ip_address
        text user_agent
    }
    
    refresh_tokens {
        uuid id PK
        uuid user_id FK "NOT NULL"
        varchar token "UNIQUE, NOT NULL"
        timestamp expires_at "NOT NULL"
        timestamp created_at
    }
    
    subjects {
        uuid id PK
        uuid user_id FK "NULL for system subjects"
        varchar name "NOT NULL"
        varchar exam_target "NULL for user subjects"
        boolean is_system "DEFAULT false"
        timestamp created_at
        "UNIQUE(user_id, name) WHERE user_id IS NOT NULL"
        "UNIQUE(exam_target, name) WHERE is_system = true"
        "CHECK constraint for subject type"
    }
    
    topics {
        uuid id PK
        uuid subject_id FK "NOT NULL -> subjects"
        varchar name "NOT NULL"
        timestamp created_at
        "UNIQUE(subject_id, name)"
    }
    
    questions {
        uuid id PK
        uuid user_id FK "NOT NULL"
        uuid subject_id FK "NOT NULL -> subjects"
        uuid topic_id FK "NOT NULL -> topics"
        varchar name "Optional question name"
        text question_image_url "NOT NULL (Cloudflare R2)"
        char correct_answer "NOT NULL (A, B, C, D, E)"
        text solution_note "Optional"
        text solution_image_url "Optional (Cloudflare R2)"
        text ai_solution "Optional"
        timestamp created_at
        timestamp updated_at
    }
    
    quiz_sessions {
        uuid id PK
        uuid user_id FK "NOT NULL"
        varchar mode "NOT NULL (learning, wrong-answers)"
        timestamp started_at "DEFAULT NOW()"
        timestamp completed_at
        integer total_questions "NOT NULL"
        integer correct_count "DEFAULT 0"
        integer incorrect_count "DEFAULT 0"
    }
    
    quiz_answers {
        uuid id PK
        uuid quiz_session_id FK "NOT NULL"
        uuid question_id FK "NOT NULL"
        char user_answer "A, B, C, D, E"
        boolean is_correct "NOT NULL"
        timestamp answered_at "DEFAULT NOW()"
    }
    
    question_statistics {
        uuid id PK
        uuid user_id FK "NOT NULL"
        uuid question_id FK "NOT NULL"
        integer total_attempts "DEFAULT 0"
        integer correct_count "DEFAULT 0"
        integer incorrect_count "DEFAULT 0"
        timestamp last_attempted_at
        "UNIQUE(user_id, question_id)"
    }
    
    daily_statistics {
        uuid id PK
        uuid user_id FK "NOT NULL"
        date date "NOT NULL"
        integer questions_solved "DEFAULT 0"
        integer correct_count "DEFAULT 0"
        integer incorrect_count "DEFAULT 0"
        "UNIQUE(user_id, date)"
    }
```

## İlişki Açıklamaları

### 1. Authentication & User Management
- **users** ↔ **login_logs**: Bir kullanıcının birden fazla giriş kaydı olabilir (1:N)
- **users** ↔ **refresh_tokens**: Bir kullanıcının birden fazla refresh token'ı olabilir (1:N)

### 2. Subjects & Topics (Unified Table Yapısı)
- **subjects**: Sistem ve kullanıcı dersleri tek tabloda tutulur
  - `is_system = true`: Sistem dersleri (user_id NULL, exam_target dolu)
  - `is_system = false`: Kullanıcı dersleri (user_id dolu, exam_target NULL)
- **users** ↔ **subjects**: Bir kullanıcı birden fazla özel ders oluşturabilir (1:N, is_system=false olanlar)
- **subjects** ↔ **topics**: Bir dersin birden fazla konusu olabilir (1:N, hem sistem hem kullanıcı dersleri için)

### 3. Questions
- **users** ↔ **questions**: Bir kullanıcının birden fazla sorusu olabilir (1:N)
- **questions** ↔ **subjects**: Sorular derslere ait (1:N, Foreign Key ile bağlı, cascade delete çalışır)
- **questions** ↔ **topics**: Sorular konulara ait (1:N, Foreign Key ile bağlı, cascade delete çalışır)

### 4. Quiz System
- **users** ↔ **quiz_sessions**: Bir kullanıcının birden fazla quiz session'ı olabilir (1:N)
- **quiz_sessions** ↔ **quiz_answers**: Bir quiz session'da birden fazla cevap olabilir (1:N)
- **questions** ↔ **quiz_answers**: Bir soru birden fazla quiz'de cevaplanabilir (1:N)

### 5. Statistics
- **users** ↔ **question_statistics**: Bir kullanıcının her soru için istatistiği olabilir (1:N)
- **questions** ↔ **question_statistics**: Her soru için kullanıcı bazlı istatistikler (1:N)
- **users** ↔ **daily_statistics**: Bir kullanıcının günlük istatistikleri (1:N)

## Önemli Notlar

### Unified Subjects Table Yapısı
**subjects** tablosu hem sistem hem kullanıcı derslerini tutar:
- **Sistem dersleri**: `is_system = true`, `user_id = NULL`, `exam_target` dolu (örn: YKS, LYS)
- **Kullanıcı dersleri**: `is_system = false`, `user_id` dolu, `exam_target = NULL`
- Check constraint ile veri bütünlüğü garantilidir
- Foreign Key constraint'leri düzgün çalışır (polymorphic relationship sorunu yok)

### Cascade Delete
Tüm foreign key'ler `ON DELETE CASCADE` ile tanımlanmıştır. Yani:
- Bir kullanıcı silindiğinde, o kullanıcıya ait tüm veriler (sorular, quiz session'ları, istatistikler vb.) otomatik olarak silinir.

### Unique Constraints
- **users.email**: Email adresi benzersiz olmalı
- **subjects**: 
  - Kullanıcı dersleri için: Aynı kullanıcı aynı dersi iki kez ekleyemez (user_id, name) WHERE user_id IS NOT NULL
  - Sistem dersleri için: Aynı exam_target için aynı ders ismi iki kez eklenemez (exam_target, name) WHERE is_system = true
- **topics**: Aynı ders altında aynı konu iki kez eklenemez (subject_id, name)
- **question_statistics**: Bir kullanıcı için bir soru için sadece bir istatistik kaydı olabilir (user_id, question_id)
- **daily_statistics**: Bir kullanıcı için bir günde sadece bir istatistik kaydı olabilir (user_id, date)
- **refresh_tokens.token**: Token benzersiz olmalı

### Indexes (Performance)
- `subjects.user_id` üzerinde partial index (WHERE user_id IS NOT NULL)
- `subjects.exam_target` üzerinde partial index (WHERE is_system = true)
- `topics.subject_id` üzerinde index
- `questions.user_id` üzerinde index
- `questions.subject_id, topic_id` üzerinde composite index
- `questions.created_at` üzerinde index
- `weekly_activity.user_id, week_start` üzerinde index
- Diğer foreign key'ler üzerinde otomatik index'ler (PostgreSQL default)

### Materialized Views
- `weekly_activity`: Haftalık aktivite için materialized view (daily_statistics tablosundan hesaplanır)
- **Önemli**: Materialized view'lar otomatik güncellenmez, manuel refresh gerektirir
- Her yeni `daily_statistics` kaydından sonra veya cron job ile düzenli refresh yapılmalıdır

---

## Tablo Sayısı
Toplam **10 tablo** (unified table yapısı ile optimize edildi):
1. users
2. login_logs
3. refresh_tokens
4. subjects (unified: sistem + kullanıcı dersleri)
5. topics (unified: sistem + kullanıcı konuları)
6. questions
7. quiz_sessions
8. quiz_answers
9. question_statistics
10. daily_statistics

**Materialized View**: weekly_activity

---

**Not**: Bu ER diagram, BACKEND_REQUIREMENTS.md dosyasındaki database şemalarına göre oluşturulmuştur.

