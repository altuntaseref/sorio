
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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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

    const tokens = await this._generateTokens(newUser);

    return {
      success: true,
      message: 'User registered successfully.',
      data: {
        user: this._toUserDto(newUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
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

    const tokens = await this._generateTokens(user);

    return {
      success: true,
      message: 'Login successful.',
      data: {
        user: this._toUserDto(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async refreshToken(user: User) {
    const tokens = await this._generateTokens(user);
    return {
      success: true,
      message: 'Tokens refreshed successfully.',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  private async _generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private _toUserDto(user: User) {
    const { password, ...result } = user;
    return result;
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }
}
