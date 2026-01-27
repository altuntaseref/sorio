import { Controller, Get, UseGuards } from '@nestjs/common';
import { AvatarsService } from './avatars.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  /**
   * Mobile API: Aktif avatar'ları getir
   * GET /api/avatars
   * Authentication: JWT Token gerekli
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAvatars() {
    const avatars = await this.avatarsService.getActiveAvatars();
    return {
      success: true,
      data: avatars.map((avatar) => ({
        id: avatar.id,
        name: avatar.name,
        imageUrl: avatar.imageUrl,
        videoUrl: avatar.videoUrl || null,
        description: avatar.description || null,
        createdAt: avatar.createdAt,
      })),
    };
  }
}
