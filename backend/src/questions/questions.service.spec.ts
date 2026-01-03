import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { QuestionStatistic } from '../statistics/entities/question-statistic.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionRepo: Repository<Question>;
  let subjectRepo: Repository<Subject>;
  let topicRepo: Repository<Topic>;

  const mockQuestion = {
    id: '1',
    name: 'Test Question',
    correctAnswer: 'A',
    subjectId: 'subj1',
    topicId: 'topic1',
    userId: 'user1',
    subject: { id: 'subj1', name: 'Math' },
    topic: { id: 'topic1', name: 'Algebra' },
    stats: [],
  } as unknown as Question;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  const mockQuestionRepo = {
    create: jest.fn((dto) => ({ ...dto, id: 'new-id' })),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockSubjectRepo = {
    findOne: jest.fn(),
  };

  const mockTopicRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: getRepositoryToken(Question),
          useValue: mockQuestionRepo,
        },
        {
          provide: getRepositoryToken(Subject),
          useValue: mockSubjectRepo,
        },
        {
          provide: getRepositoryToken(Topic),
          useValue: mockTopicRepo,
        },
        {
          provide: getRepositoryToken(QuestionStatistic),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    questionRepo = module.get<Repository<Question>>(getRepositoryToken(Question));
    subjectRepo = module.get<Repository<Subject>>(getRepositoryToken(Subject));
    topicRepo = module.get<Repository<Topic>>(getRepositoryToken(Topic));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a question', async () => {
      const createDto = { name: 'New Q' } as any;
      (subjectRepo.findOne as jest.Mock).mockResolvedValue({ id: 'subj1' });
      (topicRepo.findOne as jest.Mock).mockResolvedValue({ id: 'topic1' });
      (questionRepo.save as jest.Mock).mockResolvedValue(createDto);

      const result = await service.create('user1', createDto);
      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('should return paginated questions', async () => {
      (mockQueryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([[
        mockQuestion,
      ], 1]);
      const result = await service.findAll('user1', {});
      expect(result.questions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single question', async () => {
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(mockQuestion);
      const result = await service.findOne('user1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue({ ...mockQuestion, userId: 'user2' });
      await expect(service.findOne('user1', '1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
        const updateDto = { name: 'Updated Name' } as any;
        (questionRepo.findOne as jest.Mock).mockResolvedValue(mockQuestion);
        (questionRepo.save as jest.Mock).mockResolvedValue({ ...mockQuestion, ...updateDto });
      
        const result = await service.update('user1', '1', updateDto);
        expect(result.updatedQuestion.name).toBe('Updated Name');
      });

    it('should throw NotFoundException if question not found', async () => {
      (questionRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.update('user1', '99', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a question', async () => {
      (questionRepo.findOne as jest.Mock).mockResolvedValue(mockQuestion);
      (questionRepo.remove as jest.Mock).mockResolvedValue(mockQuestion);
      await expect(service.remove('user1', '1')).resolves.toBe(mockQuestion);
    });

    it('should throw NotFoundException if question not found', async () => {
        (questionRepo.findOne as jest.Mock).mockResolvedValue(null);
        await expect(service.remove('user1', '99')).rejects.toThrow(NotFoundException);
      });
  });
});
