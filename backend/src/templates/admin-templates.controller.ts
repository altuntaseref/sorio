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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AdminTokenGuard } from '../admin/guards/admin-token.guard';

@Controller('admin/templates')
@UseGuards(AdminTokenGuard)
export class AdminTemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Tüm template'leri getir (Admin için)
   * GET /api/admin/templates
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllTemplates() {
    const templates = await this.templatesService.getAllTemplates();
    return { success: true, data: templates };
  }

  /**
   * Template getir (ID ile)
   * GET /api/admin/templates/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTemplate(@Param('id') id: string) {
    const template = await this.templatesService.getTemplateById(id);
    return { success: true, data: template };
  }

  /**
   * Template oluştur
   * POST /api/admin/templates
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    const template = await this.templatesService.createTemplate(createTemplateDto);
    return { success: true, data: template };
  }

  /**
   * Template güncelle
   * PATCH /api/admin/templates/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const template = await this.templatesService.updateTemplate(
      id,
      updateTemplateDto,
    );
    return { success: true, data: template };
  }

  /**
   * Template sil
   * DELETE /api/admin/templates/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTemplate(@Param('id') id: string) {
    await this.templatesService.deleteTemplate(id);
    return { success: true, message: 'Template deleted successfully' };
  }
}
