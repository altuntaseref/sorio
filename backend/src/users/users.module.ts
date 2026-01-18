import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { ExamsModule } from '../exams/exams.module';
import { UserExamTarget } from '../mock-exams/entities/user-exam-target.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserExamTarget]),
    ExamsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
