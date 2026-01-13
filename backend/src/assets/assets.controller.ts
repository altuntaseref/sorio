import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GetAssetsDto } from './dto/get-assets.dto';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * Kullanıcının asset sayısını ve limiti döndürür
   * GET /api/assets/count
   */
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getAssetCount(@GetUser('id') userId: string) {
    const assetCount = await this.assetsService.getUserAssetCount(userId);
    return {
      success: true,
      data: assetCount,
    };
  }

  /**
   * Asset'leri listeler (sistem default + kullanıcı asset'leri)
   * GET /api/assets?type=IMAGE
   * Not: type=SOUND için sadece sistem default sesler döner
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAssets(
    @GetUser('id') userId: string,
    @Query() getAssetsDto: GetAssetsDto,
  ) {
    const assets = await this.assetsService.getAssets(userId, getAssetsDto);
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
   * GET /api/assets/default-sounds
   */
  @Get('default-sounds')
  @HttpCode(HttpStatus.OK)
  async getDefaultSounds(@GetUser('id') userId: string) {
    const assets = await this.assetsService.getAssets(userId, {
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
   * POST /api/assets
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAsset(
    @GetUser('id') userId: string,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    const asset = await this.assetsService.createAsset(userId, createAssetDto);
    return {
      success: true,
      message: 'Asset created successfully',
      data: { asset },
    };
  }

  /**
   * Asset siler
   * DELETE /api/assets/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteAsset(
    @GetUser('id') userId: string,
    @Param('id') assetId: string,
  ) {
    await this.assetsService.deleteAsset(assetId, userId);
    return {
      success: true,
      message: 'Asset deleted successfully',
    };
  }
}
