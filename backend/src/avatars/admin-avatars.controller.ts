import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AvatarsService } from './avatars.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { AdminTokenGuard } from '../admin/guards/admin-token.guard';

@Controller('admin/avatars')
@UseGuards(AdminTokenGuard)
export class AdminAvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  /**
   * Tüm avatar'ları getir (Admin için)
   * GET /api/admin/avatars
   */
  @Get()
  async getAvatars() {
    const avatars = await this.avatarsService.getAllAvatars();
    return { success: true, data: avatars };
  }

  /**
   * Avatar getir (ID ile)
   * GET /api/admin/avatars/:id
   */
  @Get(':id')
  async getAvatar(@Param('id') id: string) {
    const avatar = await this.avatarsService.getAvatarById(id);
    return { success: true, data: avatar };
  }

  /**
   * Avatar oluştur
   * POST /api/admin/avatars
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAvatar(@Body() createAvatarDto: CreateAvatarDto) {
    const avatar = await this.avatarsService.createAvatar(createAvatarDto);
    return { success: true, data: avatar };
  }

  /**
   * Avatar güncelle
   * PATCH /api/admin/avatars/:id
   */
  @Patch(':id')
  async updateAvatar(
    @Param('id') id: string,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    const avatar = await this.avatarsService.updateAvatar(id, updateAvatarDto);
    return { success: true, data: avatar };
  }

  /**
   * Avatar sil
   * DELETE /api/admin/avatars/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAvatar(@Param('id') id: string) {
    await this.avatarsService.deleteAvatar(id);
    return { success: true, message: 'Avatar deleted successfully' };
  }
}
