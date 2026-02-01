import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { MailModule } from '../mail/mail.module';
import { PricingModule } from '../pricing/pricing.module';
import { Plan } from '../pricing/entities/plan.entity';
import { UserPlan } from '../pricing/entities/user-plan.entity';
@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshToken, Plan, UserPlan]),
    MailModule,
    PricingModule,
  ],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
