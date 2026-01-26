import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { LogStudySessionDto } from './dto/log-study-session.dto';
import { GetSessionsDto } from './dto/get-sessions.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimerDto } from './dto/update-timer.dto';
import { StopTimerDto } from './dto/stop-timer.dto';
import { ChangeSubjectDto } from './dto/change-subject.dto';

@Controller('study-sessions')
@UseGuards(JwtAuthGuard)
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  /**
   * Study session'ı loglar (Pomodoro veya serbest timer)
   * POST /api/study-sessions/log
   */
  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  async logStudySession(
    @GetUser('id') userId: string,
    @Body() logSessionDto: LogStudySessionDto,
  ) {
    const session = await this.studySessionsService.logStudySession(
      userId,
      logSessionDto,
    );
    return {
      success: true,
      message: 'Study session logged successfully',
      data: { session },
    };
  }

  /**
   * Kullanıcının tüm study session'larını getirir
   * GET /api/study-sessions?timerType=POMODORO
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getSessions(
    @GetUser('id') userId: string,
    @Query() getSessionsDto: GetSessionsDto,
  ) {
    const sessions = await this.studySessionsService.getSessions(
      userId,
      getSessionsDto.timerType,
      getSessionsDto.examCode,
    );
    return {
      success: true,
      data: { sessions },
    };
  }

  /**
   * Tek bir study session'ı getirir
   * GET /api/study-sessions/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSession(
    @GetUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    const session = await this.studySessionsService.getSession(
      sessionId,
      userId,
    );
    return {
      success: true,
      data: { session },
    };
  }

  // ========== Active Timer Endpoints ==========

  /**
   * Aktif timer'ı getirir (uygulama açıldığında)
   * GET /api/timer/current
   */
  @Get('timer/current')
  @HttpCode(HttpStatus.OK)
  async getCurrentTimer(@GetUser('id') userId: string) {
    const timer = await this.studySessionsService.getActiveTimer(userId);
    return {
      success: true,
      data: { timer },
    };
  }

  /**
   * Timer başlatır
   * POST /api/timer/start
   */
  @Post('timer/start')
  @HttpCode(HttpStatus.CREATED)
  async startTimer(
    @GetUser('id') userId: string,
    @Body() startTimerDto: StartTimerDto,
  ) {
    const timer = await this.studySessionsService.startTimer(
      userId,
      startTimerDto,
    );
    return {
      success: true,
      message: 'Timer started successfully',
      data: { timer },
    };
  }

  /**
   * Timer'ı günceller (periyodik çağrı - her 30 saniyede bir)
   * PUT /api/timer/update
   */
  @Put('timer/update')
  @HttpCode(HttpStatus.OK)
  async updateTimer(
    @GetUser('id') userId: string,
    @Body() updateTimerDto: UpdateTimerDto,
  ) {
    const timer = await this.studySessionsService.updateTimer(
      userId,
      updateTimerDto,
    );
    return {
      success: true,
      data: { timer },
    };
  }

  /**
   * Timer'ı duraklat
   * POST /api/timer/pause
   */
  @Post('timer/pause')
  @HttpCode(HttpStatus.OK)
  async pauseTimer(@GetUser('id') userId: string) {
    const timer = await this.studySessionsService.pauseTimer(userId);
    return {
      success: true,
      message: 'Timer paused successfully',
      data: { timer },
    };
  }

  /**
   * Timer'ı devam ettir
   * POST /api/timer/resume
   */
  @Post('timer/resume')
  @HttpCode(HttpStatus.OK)
  async resumeTimer(@GetUser('id') userId: string) {
    const timer = await this.studySessionsService.resumeTimer(userId);
    return {
      success: true,
      message: 'Timer resumed successfully',
      data: { timer },
    };
  }

  /**
   * Timer'ı durdur ve study_session'a kaydet
   * POST /api/timer/stop
   */
  @Post('timer/stop')
  @HttpCode(HttpStatus.OK)
  async stopTimer(
    @GetUser('id') userId: string,
    @Body() stopTimerDto: StopTimerDto,
  ) {
    const session = await this.studySessionsService.stopTimer(
      userId,
      stopTimerDto,
    );
    return {
      success: true,
      message: 'Timer stopped successfully',
      data: { session },
    };
  }

  /**
   * Ders değiştir (mevcut timer'ı kaydet, yeni timer başlat)
   * POST /api/timer/change-subject
   */
  @Post('timer/change-subject')
  @HttpCode(HttpStatus.OK)
  async changeSubject(
    @GetUser('id') userId: string,
    @Body() changeSubjectDto: ChangeSubjectDto,
  ) {
    const result = await this.studySessionsService.changeSubject(
      userId,
      changeSubjectDto,
    );
    return {
      success: true,
      message: 'Subject changed successfully',
      data: result,
    };
  }

  /**
   * Pomodoro phase'i manuel olarak değiştir (skip)
   * POST /api/timer/pomodoro/next-phase
   */
  @Post('timer/pomodoro/next-phase')
  @HttpCode(HttpStatus.OK)
  async nextPomodoroPhase(@GetUser('id') userId: string) {
    const timer = await this.studySessionsService.nextPomodoroPhase(userId);
    return {
      success: true,
      message: 'Pomodoro phase changed successfully',
      data: { timer },
    };
  }
}
