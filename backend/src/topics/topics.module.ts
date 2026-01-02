import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './entities/topic.entity';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Topic]), forwardRef(() => SubjectsModule)],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
