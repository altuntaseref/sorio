import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { DataSource } from 'typeorm';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalyticsOverview', () => {
    it('should return a comprehensive analytics overview', async () => {
      const userId = 'user1';

      (dataSource.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('daily_statistics')) {
          return Promise.resolve([
            { totalQuestionsSolved: '10', totalCorrect: '8', totalIncorrect: '2' },
          ]);
        }
        // Use the camelCase alias "totalQuestionsAdded" as defined in the service query
        if (query.includes('COUNT(*) AS "totalQuestionsAdded"')) {
          return Promise.resolve([{ totalQuestionsAdded: '5' }]);
        }
        if (query.includes('weekly_activity')) {
          return Promise.resolve([
            {
              week: new Date().toISOString(),
              questionsSolved: '10',
              correctCount: '8',
              incorrectCount: '2',
            },
          ]);
        }
        if (query.includes('subject_statistics')) {
          return Promise.resolve([
            {
              subjectId: '1',
              subjectName: 'Math',
              questionsSolved: '5',
              correctCount: '4',
              incorrectCount: '1',
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.getAnalyticsOverview(userId);

      expect(result.totalQuestionsSolved).toBe(10);
      expect(result.overallAccuracy).toBe(80);
      expect(result.totalQuestionsAdded).toBe(5);
    });
  });

  describe('getSubjectStatistics', () => {
    it('should return statistics for each subject', async () => {
      const userId = 'user1';
      // Use camelCase properties as defined by the query aliases in the service
      const mockSubjectStats = [
        {
          subjectId: '1',
          subjectName: 'Math',
          totalQuestions: '10',
          questionsSolved: '5',
          correctCount: '4', // camelCase
          incorrectCount: '1', // camelCase
        },
      ];
      (dataSource.query as jest.Mock).mockResolvedValue(mockSubjectStats);

      const result = await service.getSubjectStatistics(userId);

      expect(result.subjects.length).toBe(1);
      // totalAttempts = 4 + 1 = 5. accuracy = (4 / 5) * 100 = 80.
      expect(result.subjects[0].accuracy).toBe(80);
    });
  });
});
