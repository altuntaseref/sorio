import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preset } from './entities/preset.entity';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { GetPresetsDto } from './dto/get-presets.dto';
import { Asset } from '../assets/entities/asset.entity';

@Injectable()
export class PresetsService {
  constructor(
    @InjectRepository(Preset)
    private presetRepository: Repository<Preset>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Kullanıcının tüm preset'lerini getirir
   */
  async getPresets(
    userId: string,
    getPresetsDto: GetPresetsDto,
  ): Promise<Preset[]> {
    const where: any = { userId };
    if (getPresetsDto.timerType) {
      where.timerType = getPresetsDto.timerType;
    }

    return this.presetRepository.find({
      where,
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Yeni bir preset oluşturur (Pomodoro veya Free Timer)
   */
  async createPreset(
    userId: string,
    createPresetDto: CreatePresetDto,
  ): Promise<Preset> {
    // Pomodoro preset'i için validasyon
    if (createPresetDto.timerType === 'POMODORO') {
      // Pomodoro için workDuration, breakDuration vb. gerekli
      if (
        !createPresetDto.workDuration ||
        !createPresetDto.breakDuration ||
        !createPresetDto.longBreakDuration ||
        !createPresetDto.setsUntilLongBreak
      ) {
        // Default değerler kullanılabilir
      }
    } else if (createPresetDto.timerType === 'FREE_TIMER') {
      // Free Timer için pomodoro alanları gerekli değil
      // Sadece name, backgroundImageId, soundId yeterli
    }

    // Asset ID validasyonu
    if (createPresetDto.backgroundImageId) {
      const backgroundAsset = await this.assetRepository.findOne({
        where: { id: createPresetDto.backgroundImageId },
      });

      if (!backgroundAsset) {
        throw new NotFoundException('Background image asset not found');
      }

      if (
        backgroundAsset.type !== 'IMAGE' &&
        backgroundAsset.type !== 'VIDEO'
      ) {
        throw new BadRequestException(
          'Background asset must be of type IMAGE or VIDEO',
        );
      }

      // Kullanıcı sadece sistem default veya kendi asset'lerini kullanabilir
      if (
        !backgroundAsset.isSystemDefault &&
        backgroundAsset.userId !== userId
      ) {
        throw new ForbiddenException(
          'You do not have access to this background image',
        );
      }
    }

    if (createPresetDto.soundId) {
      const soundAsset = await this.assetRepository.findOne({
        where: { id: createPresetDto.soundId },
      });

      if (!soundAsset) {
        throw new NotFoundException('Sound asset not found');
      }

      if (soundAsset.type !== 'SOUND') {
        throw new BadRequestException('Sound asset must be of type SOUND');
      }

      // Kullanıcı sadece sistem default sesleri kullanabilir
      if (!soundAsset.isSystemDefault) {
        throw new ForbiddenException('You do not have access to this sound');
      }
    }

    // Eğer isDefault true ise, aynı timerType'taki diğer preset'lerin isDefault'unu false yap
    if (createPresetDto.isDefault) {
      await this.presetRepository.update(
        { userId, timerType: createPresetDto.timerType, isDefault: true },
        { isDefault: false },
      );
    }

    const preset = this.presetRepository.create({
      userId,
      timerType: createPresetDto.timerType,
      name: createPresetDto.name,
      workDuration:
        createPresetDto.timerType === 'POMODORO'
          ? createPresetDto.workDuration ?? 25
          : undefined,
      breakDuration:
        createPresetDto.timerType === 'POMODORO'
          ? createPresetDto.breakDuration ?? 5
          : undefined,
      longBreakDuration:
        createPresetDto.timerType === 'POMODORO'
          ? createPresetDto.longBreakDuration ?? 15
          : undefined,
      setsUntilLongBreak:
        createPresetDto.timerType === 'POMODORO'
          ? createPresetDto.setsUntilLongBreak ?? 4
          : undefined,
      backgroundImageId: createPresetDto.backgroundImageId,
      soundId: createPresetDto.soundId,
      isDefault: createPresetDto.isDefault ?? false,
    });

    return this.presetRepository.save(preset);
  }

  /**
   * Preset günceller (sadece kullanıcı kendi preset'ini güncelleyebilir)
   */
  async updatePreset(
    presetId: string,
    userId: string,
    updatePresetDto: UpdatePresetDto,
  ): Promise<Preset> {
    const preset = await this.presetRepository.findOne({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (preset.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this preset',
      );
    }

    // Asset ID validasyonu (eğer güncelleniyorsa)
    if (updatePresetDto.backgroundImageId !== undefined) {
      if (updatePresetDto.backgroundImageId === null) {
        // null gönderilirse asset'i kaldır
        preset.backgroundImageId = undefined;
      } else {
        const backgroundAsset = await this.assetRepository.findOne({
          where: { id: updatePresetDto.backgroundImageId },
        });

        if (!backgroundAsset) {
          throw new NotFoundException('Background image asset not found');
        }

        if (
          backgroundAsset.type !== 'IMAGE' &&
          backgroundAsset.type !== 'VIDEO'
        ) {
          throw new BadRequestException(
            'Background asset must be of type IMAGE or VIDEO',
          );
        }

        // Kullanıcı sadece sistem default veya kendi asset'lerini kullanabilir
        if (
          !backgroundAsset.isSystemDefault &&
          backgroundAsset.userId !== userId
        ) {
          throw new ForbiddenException(
            'You do not have access to this background image',
          );
        }

        preset.backgroundImageId = updatePresetDto.backgroundImageId;
      }
    }

    if (updatePresetDto.soundId !== undefined) {
      if (updatePresetDto.soundId === null) {
        // null gönderilirse asset'i kaldır
        preset.soundId = undefined;
      } else {
        const soundAsset = await this.assetRepository.findOne({
          where: { id: updatePresetDto.soundId },
        });

        if (!soundAsset) {
          throw new NotFoundException('Sound asset not found');
        }

        if (soundAsset.type !== 'SOUND') {
          throw new BadRequestException('Sound asset must be of type SOUND');
        }

        // Kullanıcı sadece sistem default sesleri kullanabilir
        if (!soundAsset.isSystemDefault) {
          throw new ForbiddenException('You do not have access to this sound');
        }

        preset.soundId = updatePresetDto.soundId;
      }
    }

    // Diğer alanları güncelle
    if (updatePresetDto.name !== undefined) {
      preset.name = updatePresetDto.name;
    }

    // Pomodoro alanları sadece timerType='POMODORO' ise güncellenebilir
    if (preset.timerType === 'POMODORO') {
      if (updatePresetDto.workDuration !== undefined) {
        preset.workDuration = updatePresetDto.workDuration;
      }
      if (updatePresetDto.breakDuration !== undefined) {
        preset.breakDuration = updatePresetDto.breakDuration;
      }
      if (updatePresetDto.longBreakDuration !== undefined) {
        preset.longBreakDuration = updatePresetDto.longBreakDuration;
      }
      if (updatePresetDto.setsUntilLongBreak !== undefined) {
        preset.setsUntilLongBreak = updatePresetDto.setsUntilLongBreak;
      }
    }

    // isDefault güncellemesi (aynı timerType içinde)
    if (updatePresetDto.isDefault !== undefined) {
      if (updatePresetDto.isDefault && !preset.isDefault) {
        // Eğer bu preset default yapılıyorsa, aynı timerType'taki diğer preset'lerin isDefault'unu false yap
        await this.presetRepository.update(
          {
            userId,
            timerType: preset.timerType,
            isDefault: true,
          },
          { isDefault: false },
        );
      }
      preset.isDefault = updatePresetDto.isDefault;
    }

    return this.presetRepository.save(preset);
  }

  /**
   * Preset siler (sadece kullanıcı kendi preset'ini silebilir)
   */
  async deletePreset(presetId: string, userId: string): Promise<void> {
    const preset = await this.presetRepository.findOne({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (preset.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this preset',
      );
    }

    await this.presetRepository.remove(preset);
  }
}
