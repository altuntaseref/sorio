import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySession } from './entities/study-session.entity';
import { ActiveTimer } from './entities/active-timer.entity';
import { LogStudySessionDto } from './dto/log-study-session.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimerDto } from './dto/update-timer.dto';
import { StopTimerDto } from './dto/stop-timer.dto';
import { ChangeSubjectDto } from './dto/change-subject.dto';
import { Subject } from '../subjects/entities/subject.entity';
import { Preset } from '../presets/entities/preset.entity';
import { UsersService } from '../users/users.service';
import { PresetsService } from '../presets/presets.service';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(ActiveTimer)
    private activeTimerRepository: Repository<ActiveTimer>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private usersService: UsersService,
    private presetsService: PresetsService,
  ) {}

  /**
   * Study session'ı loglar (Pomodoro veya serbest timer)
   */
  async logStudySession(
    userId: string,
    logSessionDto: LogStudySessionDto,
  ): Promise<StudySession> {
    const { subjectId, examCode } = logSessionDto;
    let resolvedExamCode = await this.usersService.resolveExamCode(
      userId,
      examCode,
    );

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

      if (subject.examCode) {
        if (resolvedExamCode && subject.examCode !== resolvedExamCode) {
          throw new BadRequestException(
            'Selected subject does not match the requested exam code',
          );
        }
        await this.usersService.ensureExamCodeAllowed(userId, subject.examCode);
        resolvedExamCode = subject.examCode;
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
      subjectId,
      examCode: resolvedExamCode ?? undefined,
      duration: logSessionDto.duration,
      startedAt,
      endedAt,
      status: logSessionDto.status ?? 'COMPLETED',
      timerType: logSessionDto.timerType ?? 'POMODORO',
    });

    const savedSession = await this.studySessionRepository.save(studySession);

    return savedSession;
  }

  /**
   * Kullanıcının tüm study session'larını getirir
   */
  async getSessions(
    userId: string,
    timerType?: 'POMODORO' | 'FREE_TIMER',
    examCode?: string,
  ): Promise<StudySession[]> {
    const where: any = { userId };
    if (timerType) {
      where.timerType = timerType;
    }
    if (examCode) {
      const resolvedExamCode = await this.usersService.resolveExamCode(
        userId,
        examCode,
      );
      where.examCode = resolvedExamCode ?? null;
    }

    return this.studySessionRepository.find({
      where,
      relations: ['subject'],
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Tek bir study session'ı getirir
   */
  async getSession(sessionId: string, userId: string): Promise<StudySession> {
    const session = await this.studySessionRepository.findOne({
      where: { id: sessionId },
      relations: ['subject'],
    });

    if (!session) {
      throw new NotFoundException('Study session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view this session',
      );
    }

    return session;
  }

  /**
   * Kullanıcının toplam çalışma süresini dakika cinsinden döndürür
   * (study_sessions tablosundan hesaplanır)
   */
  async getTotalStudyTime(
    userId: string,
    timerType?: 'POMODORO' | 'FREE_TIMER',
  ): Promise<number> {
    const query = this.studySessionRepository
      .createQueryBuilder('session')
      .select('SUM(session.duration)', 'total')
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: 'COMPLETED' });

    if (timerType) {
      query.andWhere('session.timerType = :timerType', { timerType });
    }

    const result = await query.getRawOne();

    return parseInt(result?.total ?? '0', 10);
  }

  // ========== Active Timer Methods ==========

  /**
   * Aktif timer'ı getirir
   */
  async getActiveTimer(userId: string): Promise<ActiveTimer | null> {
    return this.activeTimerRepository.findOne({
      where: { userId },
      relations: ['subject', 'preset'],
    });
  }

  /**
   * Timer başlatır
   */
  async startTimer(userId: string, startTimerDto: StartTimerDto): Promise<ActiveTimer> {
    // Mevcut aktif timer var mı kontrol et
    const existingTimer = await this.getActiveTimer(userId);
    if (existingTimer) {
      throw new ConflictException('An active timer already exists. Please stop it first.');
    }

    let resolvedExamCode = await this.usersService.resolveExamCode(
      userId,
      startTimerDto.examCode,
    );

    // Subject ID kontrolü (eğer verilmişse)
    if (startTimerDto.subjectId) {
      const subject = await this.subjectRepository.findOne({
        where: { id: startTimerDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }

      if (!subject.isSystem && subject.userId !== userId) {
        throw new ForbiddenException(
          'You do not have access to this subject',
        );
      }

      if (subject.examCode) {
        if (resolvedExamCode && subject.examCode !== resolvedExamCode) {
          throw new BadRequestException(
            'Selected subject does not match the requested exam code',
          );
        }
        await this.usersService.ensureExamCodeAllowed(userId, subject.examCode);
        resolvedExamCode = subject.examCode;
      }
    }

    const now = new Date();
    const timer = this.activeTimerRepository.create({
      userId,
      subjectId: startTimerDto.subjectId,
      examCode: resolvedExamCode ?? undefined,
      timerType: startTimerDto.timerType,
      startedAt: now,
      lastUpdatedAt: now,
      elapsedSeconds: 0,
      isPaused: false,
    });

    // Pomodoro için preset ayarlarını yükle
    if (startTimerDto.timerType === 'POMODORO') {
      const presets = await this.presetsService.getPresets(userId, {
        timerType: 'POMODORO',
      });

      let preset: Preset | null = null;
      if (startTimerDto.presetId) {
        const foundPreset = presets.find((p) => p.id === startTimerDto.presetId);
        if (!foundPreset) {
          throw new NotFoundException('Pomodoro preset not found');
        }
        preset = foundPreset;
      } else {
        // Default preset'i bul
        preset = presets.find((p) => p.isDefault) || presets[0] || null;
      }

      if (preset) {
        timer.presetId = preset.id;
        timer.workDurationMinutes = preset.workDuration ?? 25;
        timer.breakDurationMinutes = preset.breakDuration ?? 5;
        timer.longBreakDurationMinutes = preset.longBreakDuration ?? 15;
        timer.setsUntilLongBreak = preset.setsUntilLongBreak ?? 4;
        timer.pomodoroPhase = 'WORK';
        timer.currentSet = 1;
        timer.targetDurationSeconds = (preset.workDuration ?? 25) * 60;
      } else {
        // Default değerler kullan
        timer.workDurationMinutes = 25;
        timer.breakDurationMinutes = 5;
        timer.longBreakDurationMinutes = 15;
        timer.setsUntilLongBreak = 4;
        timer.pomodoroPhase = 'WORK';
        timer.currentSet = 1;
        timer.targetDurationSeconds = 25 * 60;
      }
    }

    return this.activeTimerRepository.save(timer);
  }

  /**
   * Timer'ı günceller (periyodik çağrı)
   */
  async updateTimer(userId: string, updateTimerDto: UpdateTimerDto): Promise<ActiveTimer> {
    const timer = await this.getActiveTimer(userId);
    if (!timer) {
      throw new NotFoundException('Active timer not found');
    }

    if (timer.isPaused) {
      return timer; // Pause durumunda güncelleme yapma
    }

    timer.elapsedSeconds = updateTimerDto.elapsedSeconds;
    timer.lastUpdatedAt = new Date();

    // Pomodoro için otomatik phase kontrolü
    if (timer.timerType === 'POMODORO' && timer.targetDurationSeconds) {
      if (timer.elapsedSeconds >= timer.targetDurationSeconds) {
        await this.transitionPomodoroPhase(timer);
      }
    }

    return this.activeTimerRepository.save(timer);
  }

  /**
   * Pomodoro phase geçişi (otomatik)
   */
  private async transitionPomodoroPhase(timer: ActiveTimer): Promise<void> {
    if (timer.pomodoroPhase === 'WORK') {
      // Work bitince → Break'e geç
      const currentSet = timer.currentSet ?? 1;
      const setsUntilLongBreak = timer.setsUntilLongBreak ?? 4;
      const isLongBreak = currentSet % setsUntilLongBreak === 0;

      timer.pomodoroPhase = isLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK';
      timer.targetDurationSeconds = isLongBreak
        ? (timer.longBreakDurationMinutes ?? 15) * 60
        : (timer.breakDurationMinutes ?? 5) * 60;
      timer.elapsedSeconds = 0;
      timer.startedAt = new Date();
      timer.lastUpdatedAt = new Date();

      // Work session'ı study_sessions'a kaydet
      await this.saveWorkSessionToHistory(timer);
    } else if (
      timer.pomodoroPhase === 'SHORT_BREAK' ||
      timer.pomodoroPhase === 'LONG_BREAK'
    ) {
      // Break bitince → Work'e geç
      const wasLongBreak = timer.pomodoroPhase === 'LONG_BREAK';
      
      timer.pomodoroPhase = 'WORK';
      timer.targetDurationSeconds = (timer.workDurationMinutes ?? 25) * 60;
      timer.elapsedSeconds = 0;
      timer.startedAt = new Date();
      timer.lastUpdatedAt = new Date();

      // Long break bitince set'i artır, short break bitince de artır (her break'ten sonra)
      if (wasLongBreak) {
        // Long break bitince set'i artır
        timer.currentSet = (timer.currentSet ?? 1) + 1;
      } else {
        // Short break bitince de set'i artır
        timer.currentSet = (timer.currentSet ?? 1) + 1;
      }
    }
  }

  /**
   * Work session'ı study_sessions'a kaydet
   */
  private async saveWorkSessionToHistory(timer: ActiveTimer): Promise<void> {
    if (timer.pomodoroPhase !== 'WORK' || !timer.targetDurationSeconds) {
      return;
    }

    const workDurationMinutes = Math.floor(
      (timer.targetDurationSeconds ?? 0) / 60,
    );
    if (workDurationMinutes <= 0) {
      return;
    }

    const startedAt = new Date(timer.startedAt);
    const endedAt = new Date(startedAt.getTime() + timer.targetDurationSeconds * 1000);

    const studySession = this.studySessionRepository.create({
      userId: timer.userId,
      subjectId: timer.subjectId,
      examCode: timer.examCode,
      duration: workDurationMinutes,
      startedAt,
      endedAt,
      status: 'COMPLETED',
      timerType: 'POMODORO',
    });

    await this.studySessionRepository.save(studySession);
  }

  /**
   * Timer'ı duraklat
   */
  async pauseTimer(userId: string): Promise<ActiveTimer> {
    const timer = await this.getActiveTimer(userId);
    if (!timer) {
      throw new NotFoundException('Active timer not found');
    }

    if (timer.isPaused) {
      throw new BadRequestException('Timer is already paused');
    }

    timer.isPaused = true;
    timer.lastUpdatedAt = new Date();

    return this.activeTimerRepository.save(timer);
  }

  /**
   * Timer'ı devam ettir
   */
  async resumeTimer(userId: string): Promise<ActiveTimer> {
    const timer = await this.getActiveTimer(userId);
    if (!timer) {
      throw new NotFoundException('Active timer not found');
    }

    if (!timer.isPaused) {
      throw new BadRequestException('Timer is not paused');
    }

    // Pause süresini hesapla ve startedAt'ı güncelle
    const pauseDuration = new Date().getTime() - timer.lastUpdatedAt.getTime();
    timer.startedAt = new Date(timer.startedAt.getTime() + pauseDuration);
    timer.isPaused = false;
    timer.lastUpdatedAt = new Date();

    return this.activeTimerRepository.save(timer);
  }

  /**
   * Timer'ı durdur ve study_session'a kaydet
   */
  async stopTimer(userId: string, stopTimerDto: StopTimerDto): Promise<StudySession | null> {
    const timer = await this.getActiveTimer(userId);
    if (!timer) {
      throw new NotFoundException('Active timer not found');
    }

    const status = stopTimerDto.status ?? 'COMPLETED';
    let studySession: StudySession | null = null;

    // Sadece WORK phase'inde veya FREE_TIMER ise study_session'a kaydet
    if (
      (timer.timerType === 'POMODORO' && timer.pomodoroPhase === 'WORK') ||
      timer.timerType === 'FREE_TIMER'
    ) {
      const durationMinutes = Math.floor(timer.elapsedSeconds / 60);
      if (durationMinutes > 0) {
        const startedAt = new Date(timer.startedAt);
        const endedAt = new Date(startedAt.getTime() + timer.elapsedSeconds * 1000);

        studySession = this.studySessionRepository.create({
          userId: timer.userId,
          subjectId: timer.subjectId,
          examCode: timer.examCode,
          duration: durationMinutes,
          startedAt,
          endedAt,
          status,
          timerType: timer.timerType,
        });

        studySession = await this.studySessionRepository.save(studySession);
      }
    }

    // Aktif timer'ı sil
    await this.activeTimerRepository.remove(timer);

    return studySession;
  }

  /**
   * Ders değiştir (mevcut timer'ı kaydet, yeni timer başlat)
   */
  async changeSubject(
    userId: string,
    changeSubjectDto: ChangeSubjectDto,
  ): Promise<{ savedSession: StudySession | null; newTimer: ActiveTimer }> {
    const timer = await this.getActiveTimer(userId);
    if (!timer) {
      throw new NotFoundException('Active timer not found');
    }

    // Mevcut timer'ı kaydet (sadece WORK phase veya FREE_TIMER ise)
    let savedSession: StudySession | null = null;
    if (
      (timer.timerType === 'POMODORO' && timer.pomodoroPhase === 'WORK') ||
      timer.timerType === 'FREE_TIMER'
    ) {
      const durationMinutes = Math.floor(timer.elapsedSeconds / 60);
      if (durationMinutes > 0) {
        const startedAt = new Date(timer.startedAt);
        const endedAt = new Date(startedAt.getTime() + timer.elapsedSeconds * 1000);

        savedSession = this.studySessionRepository.create({
          userId: timer.userId,
          subjectId: timer.subjectId,
          examCode: timer.examCode,
          duration: durationMinutes,
          startedAt,
          endedAt,
          status: 'COMPLETED',
          timerType: timer.timerType,
        });

        savedSession = await this.studySessionRepository.save(savedSession);
      }
    }

    // Yeni subject kontrolü
    if (changeSubjectDto.newSubjectId) {
      const newSubject = await this.subjectRepository.findOne({
        where: { id: changeSubjectDto.newSubjectId },
      });

      if (!newSubject) {
        throw new NotFoundException('New subject not found');
      }

      if (!newSubject.isSystem && newSubject.userId !== userId) {
        throw new ForbiddenException('You do not have access to this subject');
      }

      let resolvedExamCode = await this.usersService.resolveExamCode(
        userId,
        timer.examCode,
      );

      if (newSubject.examCode) {
        if (resolvedExamCode && newSubject.examCode !== resolvedExamCode) {
          throw new BadRequestException(
            'Selected subject does not match the current exam code',
          );
        }
        await this.usersService.ensureExamCodeAllowed(userId, newSubject.examCode);
        resolvedExamCode = newSubject.examCode;
      }

      timer.subjectId = changeSubjectDto.newSubjectId;
      timer.examCode = resolvedExamCode ?? undefined;
    } else {
      timer.subjectId = undefined;
    }

    // Timer'ı sıfırla ve yeniden başlat
    timer.startedAt = new Date();
    timer.lastUpdatedAt = new Date();
    timer.elapsedSeconds = 0;

    // Pomodoro ise phase'i sıfırla
    if (timer.timerType === 'POMODORO') {
      timer.pomodoroPhase = 'WORK';
      timer.currentSet = 1;
      timer.targetDurationSeconds = (timer.workDurationMinutes ?? 25) * 60;
    }

    const newTimer = await this.activeTimerRepository.save(timer);

    return { savedSession, newTimer };
  }

  /**
   * Pomodoro phase'i manuel olarak değiştir (skip)
   */
  async nextPomodoroPhase(userId: string): Promise<ActiveTimer> {
    const timer = await this.getActiveTimer(userId);
    if (!timer) {
      throw new NotFoundException('Active timer not found');
    }

    if (timer.timerType !== 'POMODORO') {
      throw new BadRequestException('This endpoint is only for Pomodoro timers');
    }

    await this.transitionPomodoroPhase(timer);

    return this.activeTimerRepository.save(timer);
  }
}
