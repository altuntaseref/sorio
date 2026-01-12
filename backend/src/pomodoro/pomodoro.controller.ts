import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { PomodoroService } from './pomodoro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreatePomodoroPresetDto } from './dto/create-pomodoro-preset.dto';
import { UpdatePomodoroPresetDto } from './dto/update-pomodoro-preset.dto';
import { LogStudySessionDto } from './dto/log-study-session.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GetAssetsDto } from './dto/get-assets.dto';

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
   * Preset günceller
   * PUT /api/pomodoro/presets/:id
   */
  @Put('presets/:id')
  @HttpCode(HttpStatus.OK)
  async updatePreset(
    @GetUser('id') userId: string,
    @Param('id') presetId: string,
    @Body() updatePresetDto: UpdatePomodoroPresetDto,
  ) {
    const preset = await this.pomodoroService.updatePreset(
      presetId,
      userId,
      updatePresetDto,
    );
    return {
      success: true,
      message: 'Pomodoro preset updated successfully',
      data: { preset },
    };
  }

  /**
   * Preset siler
   * DELETE /api/pomodoro/presets/:id
   */
  @Delete('presets/:id')
  @HttpCode(HttpStatus.OK)
  async deletePreset(
    @GetUser('id') userId: string,
    @Param('id') presetId: string,
  ) {
    await this.pomodoroService.deletePreset(presetId, userId);
    return {
      success: true,
      message: 'Pomodoro preset deleted successfully',
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

  /**
   * Asset'leri listeler (sistem default + kullanıcı asset'leri)
   * GET /api/pomodoro/assets?type=IMAGE
   * Not: type=SOUND için sadece sistem default sesler döner
   */
  @Get('assets')
  @HttpCode(HttpStatus.OK)
  async getAssets(
    @GetUser('id') userId: string,
    @Query() getAssetsDto: GetAssetsDto,
  ) {
    const assets = await this.pomodoroService.getAssets(userId, getAssetsDto);
    return {
      success: true,
      data: {
        assets: assets.map((asset) => ({
          id: asset.id,
          type: asset.type,
          url: asset.url,
          name: asset.name,
          isSystemDefault: asset.isSystemDefault,
          fileSize: asset.fileSize,
          durationSeconds: asset.durationSeconds,
          createdAt: asset.createdAt,
        })),
      },
    };
  }

  /**
   * Sistem default sesleri getirir
   * GET /api/pomodoro/assets/default-sounds
   */
  @Get('assets/default-sounds')
  @HttpCode(HttpStatus.OK)
  async getDefaultSounds(@GetUser('id') userId: string) {
    const assets = await this.pomodoroService.getAssets(userId, {
      type: 'SOUND',
    });
    return {
      success: true,
      data: {
        sounds: assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          url: asset.url,
          isSystemDefault: asset.isSystemDefault,
          createdAt: asset.createdAt,
        })),
      },
    };
  }

  /**
   * Yeni asset oluşturur (dosya R2'ye yüklendikten sonra)
   * POST /api/pomodoro/assets
   */
  @Post('assets')
  @HttpCode(HttpStatus.CREATED)
  async createAsset(
    @GetUser('id') userId: string,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    const asset = await this.pomodoroService.createAsset(
      userId,
      createAssetDto,
    );
    return {
      success: true,
      message: 'Asset created successfully',
      data: { asset },
    };
  }

  /**
   * Asset siler
   * DELETE /api/pomodoro/assets/:id
   */
  @Delete('assets/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAsset(
    @GetUser('id') userId: string,
    @Param('id') assetId: string,
  ) {
    await this.pomodoroService.deleteAsset(assetId, userId);
    return {
      success: true,
      message: 'Asset deleted successfully',
    };
  }
}

