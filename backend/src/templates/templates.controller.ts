import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminTokenGuard } from '../admin/guards/admin-token.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Mobile API: Aktif template'leri getir
   * GET /api/templates
   * Authentication: JWT Token gerekli
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getTemplates() {
    const templates = await this.templatesService.getActiveTemplates();
    return {
      success: true,
      data: templates.map((template) => ({
        id: template.id,
        name: template.name,
        backgroundImageUrl: template.backgroundImageUrl,
        soundUrl: template.soundUrl || null,
        thumbnailUrl: template.thumbnailUrl || null,
        description: template.description || null,
        createdAt: template.createdAt,
      })),
    };
  }
}
