import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
  ) {}

  /**
   * Tüm aktif template'leri getir (Mobile API için)
   */
  async getActiveTemplates(): Promise<Template[]> {
    return this.templateRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Tüm template'leri getir (Admin için)
   */
  async getAllTemplates(): Promise<Template[]> {
    return this.templateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Template oluştur
   */
  async createTemplate(createTemplateDto: CreateTemplateDto): Promise<Template> {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      isActive: createTemplateDto.isActive ?? true,
    });

    return this.templateRepository.save(template);
  }

  /**
   * Template güncelle
   */
  async updateTemplate(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    Object.assign(template, updateTemplateDto);
    return this.templateRepository.save(template);
  }

  /**
   * Template sil
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.templateRepository.remove(template);
  }

  /**
   * Template getir (ID ile)
   */
  async getTemplateById(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }
}
