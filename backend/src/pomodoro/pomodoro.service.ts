import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PomodoroPreset } from './entities/pomodoro-preset.entity';
import { StudySession } from './entities/study-session.entity';
import { CreatePomodoroPresetDto } from './dto/create-pomodoro-preset.dto';
import { LogStudySessionDto } from './dto/log-study-session.dto';
import { Subject } from '../subjects/entities/subject.entity';

@Injectable()
export class PomodoroService {
  constructor(
    @InjectRepository(PomodoroPreset)
    private pomodoroPresetRepository: Repository<PomodoroPreset>,
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private dataSource: DataSource,
  ) {}

  /**
   * Kullanıcının tüm preset'lerini getirir
   */
  async getPresets(userId: string): Promise<PomodoroPreset[]> {
    return this.pomodoroPresetRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Yeni bir preset oluşturur
   */
  async createPreset(
    userId: string,
    createPresetDto: CreatePomodoroPresetDto,
  ): Promise<PomodoroPreset> {
    // Eğer isDefault true ise, diğer preset'lerin isDefault'unu false yap
    if (createPresetDto.isDefault) {
      await this.pomodoroPresetRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const preset = this.pomodoroPresetRepository.create({
      userId,
      name: createPresetDto.name,
      workDuration: createPresetDto.workDuration ?? 25,
      breakDuration: createPresetDto.breakDuration ?? 5,
      longBreakDuration: createPresetDto.longBreakDuration ?? 15,
      setsUntilLongBreak: createPresetDto.setsUntilLongBreak ?? 4,
      backgroundImageId: createPresetDto.backgroundImageId,
      soundId: createPresetDto.soundId,
      isDefault: createPresetDto.isDefault ?? false,
    });

    return this.pomodoroPresetRepository.save(preset);
  }

  /**
   * Study session'ı loglar ve kullanıcının total_study_time istatistiğini günceller
   */
  async logStudySession(
    userId: string,
    logSessionDto: LogStudySessionDto,
  ): Promise<StudySession> {
    // Subject ID kontrolü (eğer verilmişse)
    if (logSessionDto.subjectId) {
      const subject = await this.subjectRepository.findOne({
        where: { id: logSessionDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }

      // Kullanıcının bu derse erişimi var mı kontrol et
      if (!subject.isSystem && subject.userId !== userId) {
        throw new ForbiddenException(
          'You do not have access to this subject',
        );
      }
    }

    // Tarih validasyonu
    const startedAt = new Date(logSessionDto.startedAt);
    const endedAt = new Date(logSessionDto.endedAt);

    if (isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (endedAt <= startedAt) {
      throw new BadRequestException('endedAt must be after startedAt');
    }

    // Duration kontrolü (tarih farkı ile uyumlu mu?)
    const actualDurationMinutes = Math.round(
      (endedAt.getTime() - startedAt.getTime()) / (1000 * 60),
    );

    // %10 tolerans ile kontrol et (kullanıcı yuvarlama yapmış olabilir)
    const tolerance = Math.max(1, Math.round(logSessionDto.duration * 0.1));
    if (
      Math.abs(actualDurationMinutes - logSessionDto.duration) > tolerance
    ) {
      throw new BadRequestException(
        'Duration does not match the time difference between startedAt and endedAt',
      );
    }

    const studySession = this.studySessionRepository.create({
      userId,
      subjectId: logSessionDto.subjectId,
      duration: logSessionDto.duration,
      startedAt,
      endedAt,
      status: logSessionDto.status ?? 'COMPLETED',
    });

    const savedSession = await this.studySessionRepository.save(studySession);

    // Kullanıcının total_study_time istatistiğini güncelle
    // Not: Eğer users tablosunda total_study_time kolonu yoksa,
    // bu bilgi study_sessions tablosundan hesaplanabilir
    // Şimdilik sadece session'ı kaydediyoruz

    return savedSession;
  }

  /**
   * Kullanıcının toplam çalışma süresini dakika cinsinden döndürür
   * (study_sessions tablosundan hesaplanır)
   */
  async getTotalStudyTime(userId: string): Promise<number> {
    const result = await this.studySessionRepository
      .createQueryBuilder('session')
      .select('SUM(session.duration)', 'total')
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    return parseInt(result?.total ?? '0', 10);
  }
}

