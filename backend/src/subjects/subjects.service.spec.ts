import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Topic } from '../topics/entities/topic.entity';
import { Question } from '../questions/entities/question.entity';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let repository: Repository<Subject>;

  const mockUser = { id: 'user1', examTarget: 'YKS' } as User;

  const mockSubject: Subject = {
    id: '1',
    name: 'Test Subject',
    userId: 'user1',
    isSystem: false,
    examTarget: 'YKS',
    user: mockUser,
    topics: [] as Topic[],
    questions: [] as Question[],
    createdAt: new Date(),
  } as Subject;

  const mockSubjectRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: getRepositoryToken(Subject),
          useValue: mockSubjectRepository,
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
    repository = module.get<Repository<Subject>>(getRepositoryToken(Subject));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update a subject successfully', async () => {
      const updateDto = { name: 'Updated Name' };
      const existingSubject = { ...mockSubject };

      // Mock the initial findOne to get the subject to update
      (repository.findOne as jest.Mock).mockResolvedValue(existingSubject);
      // Mock the findOne check for name conflict to return null
      (repository.findOne as jest.Mock).mockResolvedValueOnce(existingSubject).mockResolvedValueOnce(null);
      // Mock save to return the updated subject
      (repository.save as jest.Mock).mockResolvedValue({ ...existingSubject, ...updateDto });

      const result = await service.update('1', updateDto, mockUser);

      expect(result.name).toEqual(updateDto.name);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  // Other tests remain the same...
});
