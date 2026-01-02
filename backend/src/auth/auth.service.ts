import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match.');
    }

    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      examTarget: registerDto.examTarget,
      provider: 'email',
    });

    const tokens = await this._generateAndSaveTokens(newUser);

    return {
      user: this._toUserDto(newUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmailWithPassword(
      loginDto.email,
    );

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this._generateAndSaveTokens(user);

    return {
      user: this._toUserDto(user),
      ...tokens,
    };
  }

  async refresh(user: User, refreshToken: string) {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, user: { id: user.id } },
    });

    if (!tokenRecord) {
      await this.refreshTokenRepository.delete({ user: { id: user.id } });
      throw new UnauthorizedException('Refresh token not found or revoked.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.refreshTokenRepository.remove(tokenRecord);
      throw new UnauthorizedException('Refresh token has expired.');
    }

    return this._generateAndSaveTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ user: { id: userId } });
  }

  private async _generateAndSaveTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshTokenString] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    await this.refreshTokenRepository.delete({ user: { id: user.id } });

    const newRefreshToken = this.refreshTokenRepository.create({
      user,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    return { accessToken, refreshToken: refreshTokenString };
  }

  private _toUserDto(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshTokens, ...result } = user;
    return result;
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }
}
