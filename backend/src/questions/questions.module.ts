import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';
import { QuestionStatistic } from '../statistics/entities/question-statistic.entity';
import { User } from '../users/entities/user.entity';
import { UploadModule } from '../upload/upload.module';
import { PdfService } from './pdf.service';
import { UsersModule } from '../users/users.module';
import { PricingModule } from '../pricing/pricing.module';
import { Feature } from '../pricing/entities/feature.entity';
import { PlanLimit } from '../pricing/entities/plan-limit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      Subject,
      Topic,
      QuestionStatistic,
      User,
      Feature,
      PlanLimit,
    ]),
    UploadModule,
    UsersModule,
    PricingModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, PdfService],
  exports: [PdfService],
})
export class QuestionsModule {}
