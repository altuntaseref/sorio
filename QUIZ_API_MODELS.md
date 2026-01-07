# Quiz API - Request & Response Models

## TypeScript Interfaces

```typescript
// ============================================
// COMMON TYPES
// ============================================

type QuizMode = 'learning' | 'wrong-answers';
type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';

// ============================================
// 1. QUIZ BAŞLATMA
// ============================================

// Request
interface StartQuizRequest {
  mode: QuizMode;
  subjectIds?: string[];  // En az bir subjectId veya topicId olmalı
  topicIds?: string[];    // En az bir subjectId veya topicId olmalı
}

// Response
interface StartQuizResponse {
  success: boolean;
  data: {
    quizId: string;
    totalQuestions: number;
    questions: Array<{
      id: string;
      questionImageUrl: string;
      // NOT: Cevap bilgisi gösterilmez
    }>;
  };
}

// ============================================
// 2. CEVAP VERME
// ============================================

// Request
interface SubmitAnswerRequest {
  questionId: string;      // UUID
  userAnswer: AnswerOption;
}

// Response
interface SubmitAnswerResponse {
  success: boolean;
  data: {
    isCorrect: boolean;
    correctAnswer: AnswerOption;
    stats: {
      totalAnswered: number;    // Toplam cevaplanan soru sayısı
      correctCount: number;      // Doğru cevap sayısı
      incorrectCount: number;   // Yanlış cevap sayısı
    };
  };
}

// ============================================
// 3. QUIZ BİTİRME
// ============================================

// Request
// Body yok, sadece quizId path parametresi

// Response
interface CompleteQuizResponse {
  success: boolean;
  data: {
    quizId: string;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;           // Yüzde (örn: 75.50)
    completedAt: string;        // ISO timestamp
  };
}

// ============================================
// 4. QUIZ DETAYLARINI GÖRÜNTÜLEME
// ============================================

// Request
// Body yok, sadece quizId path parametresi

// Response
interface GetQuizResponse {
  success: boolean;
  data: {
    quiz: {
      id: string;
      userId: string;
      mode: QuizMode;
      startedAt: string;         // ISO timestamp
      completedAt: string | null; // ISO timestamp veya null
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
      answers: Array<{
        id: string;
        questionId: string;
        userAnswer: AnswerOption;
        isCorrect: boolean;
        answeredAt: string;      // ISO timestamp
        question: {
          id: string;
          questionImageUrl: string;
          correctAnswer: AnswerOption;
        };
      }>;
    };
  };
}

// ============================================
// ERROR RESPONSES
// ============================================

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Örnek Error Responses:
// 400 Bad Request
{
  "statusCode": 400,
  "message": "At least one subjectId or topicId must be provided",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have access to subject with ID xxx",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Quiz session not found",
  "error": "Not Found"
}

// ============================================
// API ENDPOINTS ÖZET
// ============================================

/*
POST   /api/quiz/start
POST   /api/quiz/:quizId/answer
POST   /api/quiz/:quizId/complete
GET    /api/quiz/:quizId
*/

// ============================================
// KULLANIM ÖRNEKLERİ
// ============================================

// 1. Quiz Başlatma Örneği
const startQuizExample: StartQuizRequest = {
  mode: 'learning',
  subjectIds: ['550e8400-e29b-41d4-a716-446655440000'],
  topicIds: ['660e8400-e29b-41d4-a716-446655440001']
};

// 2. Cevap Verme Örneği
const submitAnswerExample: SubmitAnswerRequest = {
  questionId: '770e8400-e29b-41d4-a716-446655440002',
  userAnswer: 'A'
};

// 3. Response Örnekleri

// Start Quiz Response
const startQuizResponseExample: StartQuizResponse = {
  success: true,
  data: {
    quizId: '880e8400-e29b-41d4-a716-446655440003',
    totalQuestions: 10,
    questions: [
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        questionImageUrl: 'https://img.bddtechnology.com/questions/user-id/timestamp-question.jpg'
      },
      // ... diğer sorular
    ]
  }
};

// Submit Answer Response
const submitAnswerResponseExample: SubmitAnswerResponse = {
  success: true,
  data: {
    isCorrect: true,
    correctAnswer: 'A',
    stats: {
      totalAnswered: 5,
      correctCount: 4,
      incorrectCount: 1
    }
  }
};

// Complete Quiz Response
const completeQuizResponseExample: CompleteQuizResponse = {
  success: true,
  data: {
    quizId: '880e8400-e29b-41d4-a716-446655440003',
    totalQuestions: 10,
    correctCount: 8,
    incorrectCount: 2,
    accuracy: 80.00,
    completedAt: '2026-01-06T22:30:00.000Z'
  }
};

// Get Quiz Response
const getQuizResponseExample: GetQuizResponse = {
  success: true,
  data: {
    quiz: {
      id: '880e8400-e29b-41d4-a716-446655440003',
      userId: '990e8400-e29b-41d4-a716-446655440004',
      mode: 'learning',
      startedAt: '2026-01-06T22:00:00.000Z',
      completedAt: '2026-01-06T22:30:00.000Z',
      totalQuestions: 10,
      correctCount: 8,
      incorrectCount: 2,
      answers: [
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440005',
          questionId: '770e8400-e29b-41d4-a716-446655440002',
          userAnswer: 'A',
          isCorrect: true,
          answeredAt: '2026-01-06T22:05:00.000Z',
          question: {
            id: '770e8400-e29b-41d4-a716-446655440002',
            questionImageUrl: 'https://img.bddtechnology.com/questions/user-id/timestamp-question.jpg',
            correctAnswer: 'A'
          }
        },
        // ... diğer cevaplar
      ]
    }
  }
};

