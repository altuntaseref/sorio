import {
  Controller,
  Get,
  Post,
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
}
