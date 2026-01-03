import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { Question } from '../questions/entities/question.entity';
import { LoginLog } from './entities/login-log.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    provider: 'email',
    examTarget: 'YKS',
    isActive: true, // Added missing property
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [] as Question[],
    loginLogs: [] as LoginLog[], // Added missing property
    refreshTokens: [] as RefreshToken[],
  } as User;

  const mockUsersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
    findOneByEmailWithPassword: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        firstName: 'New',
        lastName: 'User',
        examTarget: 'YKS',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue({ ...mockUser, id: '2' });
      mockJwtService.signAsync.mockResolvedValue('some-token');
      mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      mockUsersService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('some-token');
      mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
    });
  });
});
