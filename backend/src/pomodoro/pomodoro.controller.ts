import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PomodoroService } from './pomodoro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreatePomodoroPresetDto } from './dto/create-pomodoro-preset.dto';
import { LogStudySessionDto } from './dto/log-study-session.dto';

@Controller('pomodoro')
@UseGuards(JwtAuthGuard)
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  /**
   * Kullanıcının kayıtlı preset'lerini getirir
   * GET /api/pomodoro/presets
   */
  @Get('presets')
  @HttpCode(HttpStatus.OK)
  async getPresets(@GetUser('id') userId: string) {
    const presets = await this.pomodoroService.getPresets(userId);
    return {
      success: true,
      data: { presets },
    };
  }

  /**
   * Yeni bir preset oluşturur
   * POST /api/pomodoro/presets
   */
  @Post('presets')
  @HttpCode(HttpStatus.CREATED)
  async createPreset(
    @GetUser('id') userId: string,
    @Body() createPresetDto: CreatePomodoroPresetDto,
  ) {
    const preset = await this.pomodoroService.createPreset(
      userId,
      createPresetDto,
    );
    return {
      success: true,
      message: 'Pomodoro preset created successfully',
      data: { preset },
    };
  }

  /**
   * Bir study session'ı loglar
   * POST /api/pomodoro/log
   */
  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  async logStudySession(
    @GetUser('id') userId: string,
    @Body() logSessionDto: LogStudySessionDto,
  ) {
    const session = await this.pomodoroService.logStudySession(
      userId,
      logSessionDto,
    );
    return {
      success: true,
      message: 'Study session logged successfully',
      data: { session },
    };
  }
}

