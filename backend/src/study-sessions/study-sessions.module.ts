import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsController } from './study-sessions.controller';
import { StudySession } from './entities/study-session.entity';
import { ActiveTimer } from './entities/active-timer.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { UsersModule } from '../users/users.module';
import { PresetsModule } from '../presets/presets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudySession, ActiveTimer, Subject]),
    UsersModule,
    PresetsModule,
  ],
  controllers: [StudySessionsController],
  providers: [StudySessionsService],
  exports: [StudySessionsService],
})
export class StudySessionsModule {}
