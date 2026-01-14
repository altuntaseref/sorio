import { Controller, Get, Param } from '@nestjs/common';
import { ExamsService } from './exams.service';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  async findAll() {
    const exams = await this.examsService.findAll();
    return {
      success: true,
      data: { exams },
    };
  }

  @Get(':code')
  async findOneByCode(@Param('code') code: string) {
    const exam = await this.examsService.findOneByCode(code);
    if (!exam) {
      return {
        success: false,
        message: 'Exam not found',
      };
    }
    return {
      success: true,
      data: { exam },
    };
  }
}
