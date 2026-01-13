import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySession } from './entities/study-session.entity';
import { LogStudySessionDto } from './dto/log-study-session.dto';
import { Subject } from '../subjects/entities/subject.entity';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  /**
   * Study session'ı loglar (Pomodoro veya serbest timer)
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
  ): Promise<StudySession[]> {
    const where: any = { userId };
    if (timerType) {
      where.timerType = timerType;
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
}
