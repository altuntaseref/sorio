import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PresetsService } from './presets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { GetPresetsDto } from './dto/get-presets.dto';

@Controller('presets')
@UseGuards(JwtAuthGuard)
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  /**
   * Kullanıcının kayıtlı preset'lerini getirir
   * GET /api/presets?timerType=POMODORO
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPresets(
    @GetUser('id') userId: string,
    @Query() getPresetsDto: GetPresetsDto,
  ) {
    const presets = await this.presetsService.getPresets(userId, getPresetsDto);
    return {
      success: true,
      data: { presets },
    };
  }

  /**
   * Yeni bir preset oluşturur (Pomodoro veya Free Timer)
   * POST /api/presets
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPreset(
    @GetUser('id') userId: string,
    @Body() createPresetDto: CreatePresetDto,
  ) {
    const preset = await this.presetsService.createPreset(
      userId,
      createPresetDto,
    );
    return {
      success: true,
      message: 'Preset created successfully',
      data: { preset },
    };
  }

  /**
   * Preset günceller
   * PUT /api/presets/:id
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updatePreset(
    @GetUser('id') userId: string,
    @Param('id') presetId: string,
    @Body() updatePresetDto: UpdatePresetDto,
  ) {
    const preset = await this.presetsService.updatePreset(
      presetId,
      userId,
      updatePresetDto,
    );
    return {
      success: true,
      message: 'Preset updated successfully',
      data: { preset },
    };
  }

  /**
   * Preset siler
   * DELETE /api/presets/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePreset(
    @GetUser('id') userId: string,
    @Param('id') presetId: string,
  ) {
    await this.presetsService.deletePreset(presetId, userId);
    return {
      success: true,
      message: 'Preset deleted successfully',
    };
  }
}
