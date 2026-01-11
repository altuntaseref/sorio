import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { R2Service } from './r2.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
import { DeleteImageDto } from './dto/delete-image.dto';
import * as mime from 'mime-types';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly r2Service: R2Service) {}

  @Get('presigned-url')
  async getPresignedUrl(
    @GetUser() user: User,
    @Query() { fileName, fileType, contentType }: GetPresignedUrlDto,
  ) {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    // Dosya tipine göre izin verilen uzantılar
    let allowedExtensions: string[];
    let maxFileSize: number; // byte cinsinden

    if (fileType === 'pomodoro-asset') {
      // Pomodoro asset için: görsel, ses ve video/GIF
      allowedExtensions = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif',
        'mp4',
        'webm',
        'mov',
        'mp3',
        'wav',
        'ogg',
      ];
      maxFileSize = 10 * 1024 * 1024; // 10MB
    } else {
      // Diğer dosya tipleri için sadece görsel
      allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid or missing file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
      );
    }

    const resolvedContentType =
      contentType || mime.lookup(fileName) || 'application/octet-stream';

    const key = this.r2Service.generateFileKey(fileType, user.id, fileName);

    const expiresIn = 900; // 15 minutes
    const { uploadUrl, publicUrl } = await this.r2Service.generatePresignedUrl(
      key,
      resolvedContentType,
      expiresIn,
    );

    return {
      success: true,
      data: {
        uploadUrl,
        publicUrl,
        key,
        expiresIn,
      },
    };
  }

  @Delete('image')
  async deleteImage(
    @GetUser() user: User,
    @Query() { key }: DeleteImageDto,
  ) {
    const keyParts = key.split('/');
    // Validate that the key belongs to the current user
    if (keyParts.length < 3 || keyParts[1] !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this file.');
    }

    await this.r2Service.deleteObject(key);

    return {
      success: true,
      message: 'Image deleted successfully',
    };
  }
}
