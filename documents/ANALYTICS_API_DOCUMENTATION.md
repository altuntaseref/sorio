# Analytics API Documentation

This document describes the Analytics endpoints, request parameters, and
response models used by the Analysis screens.

Base path: `/api/analytics`

Authentication: `Authorization: Bearer <jwt_token>`

## Common Query Params

### range

Optional range for time-based analytics.

- `week` (default)
- `month`
- `all`

Example: `?range=week`

## Endpoints

### 1) Get Analytics Overview

**GET** `/analytics/overview`

Response:
```json
{
  "success": true,
  "data": {
    "totalQuestionsSolved": 0,
    "totalCorrect": 0,
    "totalIncorrect": 0,
    "overallAccuracy": 0,
    "totalQuestionsAdded": 0,
    "weeklyActivity": [
      {
        "week": "2025-01-06",
        "questionsSolved": 120,
        "correctCount": 90,
        "incorrectCount": 30,
        "isRecordWeek": false
      }
    ],
    "subjectBreakdown": [
      {
        "subjectId": "uuid",
        "subjectName": "Matematik",
        "questionsSolved": 300,
        "correctCount": 210,
        "incorrectCount": 90,
        "accuracy": 70
      }
    ],
    "motivation": {
      "title": "Success keeps coming",
      "message": "Keep going!",
      "type": "general"
    }
  }
}
```

### 2) Get Weekly Activity

**GET** `/analytics/weekly-activity?weeks=12`

Query:
```json
{
  "weeks": 12
}
```

Response:
```json
{
  "success": true,
  "data": {
    "weeks": [
      {
        "week": "2025-W03",
        "weekStart": "2025-01-13T00:00:00.000Z",
        "weekEnd": "2025-01-19T00:00:00.000Z",
        "questionsSolved": 140,
        "correctCount": 100,
        "incorrectCount": 40,
        "accuracy": 71.43,
        "isRecordWeek": false
      }
    ],
    "recordWeek": {
      "week": "2025-W02",
      "questionsSolved": 180
    }
  }
}
```

### 3) Get Subject Statistics

**GET** `/analytics/subjects`

Response:
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "subjectId": "uuid",
        "subjectName": "Fizik",
        "totalQuestions": 120,
        "questionsSolved": 90,
        "correctCount": 60,
        "incorrectCount": 30,
        "accuracy": 66.67
      }
    ]
  }
}
```

## Analysis Tabs

### 4) General Tab

**GET** `/analytics/general?range=week|month|all`

Response:
```json
{
  "success": true,
  "data": {
    "period": {
      "range": "week",
      "startDate": "2025-01-10",
      "endDate": "2025-01-16",
      "previousStartDate": "2025-01-03",
      "previousEndDate": "2025-01-09"
    },
    "coachInsight": {
      "title": "Weekly coach insight",
      "message": "Keep momentum.",
      "type": "general",
      "ctaLabel": "View detailed report"
    },
    "totalProductivity": {
      "totalStudyMinutes": 2535,
      "studyDeltaPercent": 12.5,
      "questionsSolved": 1240,
      "accuracyPercent": 78.4,
      "correctCount": 972,
      "incorrectCount": 268
    },
    "timeAnalysis": {
      "dailyFocus": [
        { "date": "2025-01-10", "minutes": 35 },
        { "date": "2025-01-11", "minutes": 60 }
      ],
      "peakHour": { "from": 19, "to": 22 }
    },
    "examSummary": {
      "examCode": "TYT",
      "averageNet": 78.5,
      "targetNet": 90,
      "remainingNet": 11.5,
      "progressPercent": 87.22,
      "lastExam": {
        "examName": "TYT-2",
        "examDate": "2025-01-15T00:00:00.000Z",
        "net": 78.5,
        "delta": 4.5
      }
    }
  }
}
```

### 5) Questions Tab

**GET** `/analytics/questions?range=week|month|all`

Response:
```json
{
  "success": true,
  "data": {
    "period": {
      "range": "week",
      "startDate": "2025-01-10",
      "endDate": "2025-01-16",
      "previousStartDate": "2025-01-03",
      "previousEndDate": "2025-01-09"
    },
    "subjectPerformance": [
      {
        "subjectId": "uuid",
        "subjectName": "Matematik",
        "totalAttempts": 120,
        "correctCount": 90,
        "incorrectCount": 30,
        "accuracyPercent": 75
      }
    ],
    "weakTopics": [
      {
        "topicId": "uuid",
        "topicName": "Trigonometri",
        "subjectName": "Matematik",
        "totalAttempts": 20,
        "correctCount": 8,
        "incorrectCount": 12,
        "accuracyPercent": 40
      }
    ],
    "questionPool": {
      "total": 2450,
      "learned": 1470,
      "incorrect": 490,
      "new": 490
    }
  }
}
```

### 6) Time Tab

**GET** `/analytics/time?range=week|month|all`

Response:
```json
{
  "success": true,
  "data": {
    "period": {
      "range": "week",
      "startDate": "2025-01-10",
      "endDate": "2025-01-16",
      "previousStartDate": "2025-01-03",
      "previousEndDate": "2025-01-09"
    },
    "weeklyFocus": [
      {
        "date": "2025-01-10",
        "pomodoroMinutes": 40,
        "freeTimerMinutes": 15,
        "totalMinutes": 55
      }
    ],
    "subjectDistribution": [
      {
        "subjectId": "uuid",
        "subjectName": "Matematik",
        "totalMinutes": 720,
        "dailyAverageMinutes": 102.86,
        "weeklyAverageMinutes": 720,
        "monthlyAverageMinutes": 720
      }
    ],
    "totals": {
      "periodTotalMinutes": 2535,
      "dailyAverageMinutes": 362.14,
      "longestSessionMinutes": 90,
      "longestSessionType": "POMODORO"
    },
    "heatmap": [
      { "dayOfWeek": 1, "hour": 19, "minutes": 30 }
    ]
  }
}
```

### 7) Exams Tab

**GET** `/analytics/exams?range=week|month|all&examCode=TYT`

Response:
```json
{
  "success": true,
  "data": {
    "period": {
      "range": "all",
      "startDate": null,
      "endDate": "2025-01-16",
      "previousStartDate": null,
      "previousEndDate": null
    },
    "examCode": "TYT",
    "averageNet": 78.5,
    "targetNet": 90,
    "remainingNet": 11.5,
    "progressPercent": 87.22,
    "trend": [
      { "period": "2024-11-01", "averageNet": 70.25 },
      { "period": "2024-12-01", "averageNet": 75.1 }
    ],
    "simulation": {
      "estimatedRank": 38000,
      "isEstimate": true,
      "note": "Estimated from mock exam performance."
    },
    "subjectDetails": [
      {
        "subjectId": "uuid",
        "subjectName": "Matematik",
        "averageNet": 32.5,
        "previousAverageNet": 30.25,
        "delta": 2.25,
        "recentNets": [28, 30, 31.5, 33, 34, 35]
      }
    ]
  }
}
```

