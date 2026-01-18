import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockExamsService } from './mock-exams.service';
import { MockExamsController } from './mock-exams.controller';
import { UserExamTarget } from './entities/user-exam-target.entity';
import { ExamTargetGoal } from './entities/exam-target-goal.entity';
import { MockExam } from './entities/mock-exam.entity';
import { MockExamSubjectResult } from './entities/mock-exam-subject-result.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserExamTarget,
      ExamTargetGoal,
      MockExam,
      MockExamSubjectResult,
      Subject,
      Exam,
      User,
    ]),
  ],
  controllers: [MockExamsController],
  providers: [MockExamsService],
  exports: [MockExamsService],
})
export class MockExamsModule {}
