import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PomodoroService } from './pomodoro.service';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroPreset } from './entities/pomodoro-preset.entity';
import { StudySession } from './entities/study-session.entity';
import { PomodoroAsset } from './entities/pomodoro-asset.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PomodoroPreset,
      StudySession,
      PomodoroAsset,
      Subject,
    ]),
    UploadModule,
  ],
  controllers: [PomodoroController],
  providers: [PomodoroService],
  exports: [PomodoroService],
})
export class PomodoroModule {}

