import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GetAssetsDto } from './dto/get-assets.dto';
import { R2Service } from '../upload/r2.service';
import { Preset } from '../presets/entities/preset.entity';

@Injectable()
export class AssetsService {
  // Kullanıcı başına maksimum yüklenebilir asset sayısı
  private readonly MAX_USER_ASSETS = 5;

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Preset)
    private presetRepository: Repository<Preset>,
    private r2Service: R2Service,
  ) {}

  /**
   * Asset'leri listeler (sistem default + kullanıcı asset'leri)
   * Not: SOUND tipi için sadece sistem default sesler döner
   */
  async getAssets(
    userId: string,
    getAssetsDto: GetAssetsDto,
  ): Promise<Asset[]> {
    const query = this.assetRepository.createQueryBuilder('asset');

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
  ): Promise<Asset> {
    // SOUND tipinde asset oluşturmayı engelle
    if (createAssetDto.type === 'SOUND') {
      throw new BadRequestException(
        'Sound assets cannot be created by users. Only system default sounds are available.',
      );
    }

    // Kullanıcının mevcut asset sayısını kontrol et
    const userAssetCount = await this.assetRepository.count({
      where: {
        userId,
        isSystemDefault: false,
      },
    });

    if (userAssetCount >= this.MAX_USER_ASSETS) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${this.MAX_USER_ASSETS} assets. Please delete an existing asset before uploading a new one.`,
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

    const asset = this.assetRepository.create({
      userId,
      type: createAssetDto.type,
      url: createAssetDto.url,
      name: createAssetDto.name,
      r2Key: createAssetDto.r2Key,
      fileSize: createAssetDto.fileSize,
      durationSeconds: createAssetDto.durationSeconds,
      isSystemDefault: false,
    });

    return this.assetRepository.save(asset);
  }

  /**
   * Kullanıcının mevcut asset sayısını ve limiti döndürür
   */
  async getUserAssetCount(userId: string): Promise<{
    count: number;
    limit: number;
    remaining: number;
  }> {
    const count = await this.assetRepository.count({
      where: {
        userId,
        isSystemDefault: false,
      },
    });

    return {
      count,
      limit: this.MAX_USER_ASSETS,
      remaining: Math.max(0, this.MAX_USER_ASSETS - count),
    };
  }

  /**
   * Asset siler (sadece kullanıcı kendi asset'ini silebilir)
   */
  async deleteAsset(assetId: string, userId: string): Promise<void> {
    const asset = await this.assetRepository.findOne({
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
    const presetsUsingAsset = await this.presetRepository.find({
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
        await this.presetRepository.save(preset);
      }
    }

    // Asset'i sil
    await this.assetRepository.remove(asset);
  }
}
