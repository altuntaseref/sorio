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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalyticsOverview', () => {
    it('should return a comprehensive analytics overview', async () => {
      const userId = 'user1';

      // Mock raw query results
      mockDataSource.query.mockImplementation((query: string) => {
        if (query.includes('daily_statistics')) {
          return Promise.resolve([
            { totalquestionssolved: 10, totalcorrect: 8, totalincorrect: 2 },
          ]);
        }
        if (query.includes('total_questions_added')) {
          return Promise.resolve([{ count: 5 }]);
        }
        if (query.includes('weekly_activity')) {
          return Promise.resolve([
            {
              week: new Date().toISOString(),
              questionssolved: 10,
              correctcount: 8,
              incorrectcount: 2,
            },
          ]);
        }
        if (query.includes('subject_statistics')) {
          return Promise.resolve([
            {
              subjectid: '1',
              subjectname: 'Math',
              questionssolved: 5,
              correctcount: 4,
              incorrectcount: 1,
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.getAnalyticsOverview(userId);

      expect(result.totalQuestionsSolved).toBe(10);
      expect(result.overallAccuracy).toBe(80);
      expect(result.totalQuestionsAdded).toBe(5);
      expect(result.weeklyActivity.length).toBe(1);
      expect(result.subjectBreakdown.length).toBe(1);
    });
  });

  describe('getWeeklyActivity', () => {
    it('should return formatted weekly activity', async () => {
      const userId = 'user1';
      const weeks = 4;
      const mockWeeklyData = [
        {
          week_start: new Date('2023-01-02').toISOString(),
          total_solved: 10,
          total_correct: 8,
          total_incorrect: 2,
        },
      ];
      mockDataSource.query.mockResolvedValue(mockWeeklyData);

      const result = await service.getWeeklyActivity(userId, weeks);

      expect(dataSource.query).toHaveBeenCalled();
      expect(result.data.weeks.length).toBe(1);
      expect(result.data.weeks[0].accuracy).toBe(80);
    });
  });

  describe('getSubjectStatistics', () => {
    it('should return statistics for each subject', async () => {
      const userId = 'user1';
      const mockSubjectStats = [
        {
          subjectid: '1',
          subjectname: 'Math',
          totalquestions: 10,
          questionssolved: 5,
          correctcount: 4,
          incorrectcount: 1,
        },
      ];
      mockDataSource.query.mockResolvedValue(mockSubjectStats);

      const result = await service.getSubjectStatistics(userId);

      expect(result.subjects.length).toBe(1);
      expect(result.subjects[0].accuracy).toBe(80);
    });
  });
});
