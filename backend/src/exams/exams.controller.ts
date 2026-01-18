import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ExamsService } from './exams.service';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @SkipThrottle()
  @Get()
  async findAll() {
    const exams = await this.examsService.findAll();
    return {
      success: true,
      data: { exams },
    };
  }

  @SkipThrottle()
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

  @Patch(':code')
  async updateExam(
    @Param('code') code: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    const examDate = updateExamDto.examDate ? new Date(updateExamDto.examDate) : undefined;
    const exam = await this.examsService.updateExam(code, examDate);
    
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return {
      success: true,
      message: 'Exam updated successfully',
      data: { exam },
    };
  }
}
