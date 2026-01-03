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

describe('SubjectsService', () => {
  let service: SubjectsService;
  let repository: Repository<Subject>;

  const mockUser = {
    id: 'user1',
    examTarget: 'YKS',
  } as User;

  const mockSubject: Subject = {
    id: '1',
    name: 'Test Subject',
    userId: 'user1',
    isSystem: false,
    examTarget: 'YKS',
    user: Promise.resolve(mockUser),
    topics: Promise.resolve([]),
    questions: Promise.resolve([]),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubjectRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
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

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new subject', async () => {
      mockSubjectRepository.findOne.mockResolvedValue(null);
      mockSubjectRepository.create.mockReturnValue(mockSubject);
      mockSubjectRepository.save.mockResolvedValue(mockSubject);

      const result = await service.create({ name: 'Test Subject' }, mockUser);
      expect(result).toEqual(mockSubject);
      expect(mockSubjectRepository.findOne).toHaveBeenCalled();
      expect(mockSubjectRepository.create).toHaveBeenCalled();
      expect(mockSubjectRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if subject already exists', async () => {
      mockSubjectRepository.findOne.mockResolvedValue(mockSubject);
      await expect(service.create({ name: 'Test Subject' }, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllForUser', () => {
    it('should return system and custom subjects', async () => {
      mockSubjectRepository.find.mockResolvedValue([mockSubject]);
      const result = await service.findAllForUser(mockUser);
      expect(result).toHaveProperty('systemSubjects');
      expect(result).toHaveProperty('customSubjects');
      expect(mockSubjectRepository.find).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update a subject', async () => {
      const updatedSubject = { ...mockSubject, name: 'Updated Name' };
      mockSubjectRepository.findOne.mockResolvedValue(mockSubject); // Find subject to update
      mockSubjectRepository.save.mockResolvedValue(updatedSubject);

      const result = await service.update(
        '1',
        { name: 'Updated Name' },
        mockUser,
      );
      expect(result.name).toEqual('Updated Name');
    });

    it('should throw ForbiddenException when trying to update a system subject', async () => {
      const systemSubject = { ...mockSubject, isSystem: true };
      mockSubjectRepository.findOne.mockResolvedValue(systemSubject);
      await expect(service.update('1', {}, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a subject', async () => {
      mockSubjectRepository.findOne.mockResolvedValue(mockSubject);
      await service.remove('1', mockUser);
      expect(mockSubjectRepository.remove).toHaveBeenCalledWith(mockSubject);
    });

    it('should throw NotFoundException if subject is not found', async () => {
      mockSubjectRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
