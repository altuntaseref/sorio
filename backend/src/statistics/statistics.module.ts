import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStatistic } from './entities/daily-statistic.entity';
import { QuestionStatistic } from './entities/question-statistic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyStatistic, QuestionStatistic])],
  providers: [],
})
export class StatisticsModule {}
