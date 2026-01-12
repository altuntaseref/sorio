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
import { PomodoroAsset } from './entities/pomodoro-asset.entity';
import { CreatePomodoroPresetDto } from './dto/create-pomodoro-preset.dto';
import { UpdatePomodoroPresetDto } from './dto/update-pomodoro-preset.dto';
import { LogStudySessionDto } from './dto/log-study-session.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GetAssetsDto } from './dto/get-assets.dto';
import { Subject } from '../subjects/entities/subject.entity';
import { R2Service } from '../upload/r2.service';

@Injectable()
export class PomodoroService {
  constructor(
    @InjectRepository(PomodoroPreset)
    private pomodoroPresetRepository: Repository<PomodoroPreset>,
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(PomodoroAsset)
    private pomodoroAssetRepository: Repository<PomodoroAsset>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    private dataSource: DataSource,
    private r2Service: R2Service,
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
   * Preset günceller (sadece kullanıcı kendi preset'ini güncelleyebilir)
   */
  async updatePreset(
    presetId: string,
    userId: string,
    updatePresetDto: UpdatePomodoroPresetDto,
  ): Promise<PomodoroPreset> {
    const preset = await this.pomodoroPresetRepository.findOne({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Pomodoro preset not found');
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
        const backgroundAsset = await this.pomodoroAssetRepository.findOne({
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
        const soundAsset = await this.pomodoroAssetRepository.findOne({
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

    // isDefault güncellemesi
    if (updatePresetDto.isDefault !== undefined) {
      if (updatePresetDto.isDefault && !preset.isDefault) {
        // Eğer bu preset default yapılıyorsa, diğer preset'lerin isDefault'unu false yap
        await this.pomodoroPresetRepository.update(
          { userId, isDefault: true },
          { isDefault: false },
        );
      }
      preset.isDefault = updatePresetDto.isDefault;
    }

    return this.pomodoroPresetRepository.save(preset);
  }

  /**
   * Preset siler (sadece kullanıcı kendi preset'ini silebilir)
   */
  async deletePreset(presetId: string, userId: string): Promise<void> {
    const preset = await this.pomodoroPresetRepository.findOne({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Pomodoro preset not found');
    }

    if (preset.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this preset',
      );
    }

    await this.pomodoroPresetRepository.remove(preset);
  }

  /**
   * Yeni bir preset oluşturur
   */
  async createPreset(
    userId: string,
    createPresetDto: CreatePomodoroPresetDto,
  ): Promise<PomodoroPreset> {
    // Asset ID validasyonu
    if (createPresetDto.backgroundImageId) {
      const backgroundAsset = await this.pomodoroAssetRepository.findOne({
        where: { id: createPresetDto.backgroundImageId },
      });

      if (!backgroundAsset) {
        throw new NotFoundException('Background image asset not found');
      }

      if (backgroundAsset.type !== 'IMAGE' && backgroundAsset.type !== 'VIDEO') {
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
      const soundAsset = await this.pomodoroAssetRepository.findOne({
        where: { id: createPresetDto.soundId },
      });

      if (!soundAsset) {
        throw new NotFoundException('Sound asset not found');
      }

      if (soundAsset.type !== 'SOUND') {
        throw new BadRequestException('Sound asset must be of type SOUND');
      }

      // Kullanıcı sadece sistem default veya kendi asset'lerini kullanabilir
      if (!soundAsset.isSystemDefault && soundAsset.userId !== userId) {
        throw new ForbiddenException('You do not have access to this sound');
      }
    }

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

  /**
   * Asset'leri listeler (sistem default + kullanıcı asset'leri)
   * Not: SOUND tipi için sadece sistem default sesler döner
   */
  async getAssets(
    userId: string,
    getAssetsDto: GetAssetsDto,
  ): Promise<PomodoroAsset[]> {
    const query = this.pomodoroAssetRepository.createQueryBuilder('asset');

    // SOUND tipi için sadece sistem default sesleri göster
    if (getAssetsDto.type === 'SOUND') {
      query.where('asset.type = :type', { type: 'SOUND' });
      query.andWhere('asset.isSystemDefault = true');
    } else {
      // Diğer tipler için: sistem default + kullanıcı asset'leri
      query.where(
        '(asset.isSystemDefault = true OR asset.userId = :userId)',
        { userId },
      );

      if (getAssetsDto.type) {
        query.andWhere('asset.type = :type', { type: getAssetsDto.type });
      }
    }

    return query
      .orderBy('asset.isSystemDefault', 'DESC')
      .addOrderBy('asset.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Yeni asset oluşturur (kullanıcı yüklediği dosya için)
   * Not: SOUND tipinde asset oluşturulamaz (sadece sistem default sesler kullanılabilir)
   */
  async createAsset(
    userId: string,
    createAssetDto: CreateAssetDto,
  ): Promise<PomodoroAsset> {
    // SOUND tipinde asset oluşturmayı engelle
    if (createAssetDto.type === 'SOUND') {
      throw new BadRequestException(
        'Sound assets cannot be created by users. Only system default sounds are available.',
      );
    }

    // Video/GIF için validasyonlar
    if (createAssetDto.type === 'VIDEO') {
      // Dosya boyutu kontrolü (max 10MB)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (createAssetDto.fileSize && createAssetDto.fileSize > maxFileSize) {
        throw new BadRequestException(
          'Video/GIF file size cannot exceed 10MB',
        );
      }

      // Video/GIF süresi kontrolü (max 30 saniye)
      const maxDuration = 30; // saniye
      if (
        createAssetDto.durationSeconds &&
        createAssetDto.durationSeconds > maxDuration
      ) {
        throw new BadRequestException(
          'Video/GIF duration cannot exceed 30 seconds',
        );
      }
    }

    const asset = this.pomodoroAssetRepository.create({
      userId,
      type: createAssetDto.type,
      url: createAssetDto.url,
      name: createAssetDto.name,
      r2Key: createAssetDto.r2Key,
      fileSize: createAssetDto.fileSize,
      durationSeconds: createAssetDto.durationSeconds,
      isSystemDefault: false,
    });

    return this.pomodoroAssetRepository.save(asset);
  }

  /**
   * Asset siler (sadece kullanıcı kendi asset'ini silebilir)
   */
  async deleteAsset(assetId: string, userId: string): Promise<void> {
    const asset = await this.pomodoroAssetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.isSystemDefault) {
      throw new ForbiddenException('Cannot delete system default assets');
    }

    if (asset.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this asset',
      );
    }

    // R2'den dosyayı sil (eğer r2Key varsa)
    if (asset.r2Key) {
      try {
        await this.r2Service.deleteObject(asset.r2Key);
      } catch (error) {
        // R2'den silme hatası olsa bile DB'den silmeye devam et
        console.error('Error deleting asset from R2:', error);
      }
    }

    // Preset'lerde kullanılıyor mu kontrol et
    const presetsUsingAsset = await this.pomodoroPresetRepository.find({
      where: [
        { backgroundImageId: assetId },
        { soundId: assetId },
      ],
    });

    // Eğer preset'lerde kullanılıyorsa, preset'lerdeki referansları undefined yap
    if (presetsUsingAsset.length > 0) {
      for (const preset of presetsUsingAsset) {
        if (preset.backgroundImageId === assetId) {
          preset.backgroundImageId = undefined;
        }
        if (preset.soundId === assetId) {
          preset.soundId = undefined;
        }
        await this.pomodoroPresetRepository.save(preset);
      }
    }

    // Asset'i sil
    await this.pomodoroAssetRepository.remove(asset);
  }
}

