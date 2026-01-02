import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { R2Service } from './r2.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
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
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Invalid or missing file extension. Only JPG, JPEG, PNG, and WEBP are allowed.',
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
}
