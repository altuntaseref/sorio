import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { DatabaseModule } from '../common/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
