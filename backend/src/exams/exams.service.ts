import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamSection } from './entities/exam-section.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamSection)
    private readonly examSectionRepository: Repository<ExamSection>,
  ) {}

  async findAll(): Promise<Exam[]> {
    return this.examRepository.find({
      relations: ['sections'],
      order: { order: 'ASC', sections: { orderIndex: 'ASC' } },
    });
  }

  async findOneByCode(code: string): Promise<Exam | null> {
    return this.examRepository.findOne({
      where: { code },
      relations: ['sections'],
      order: { sections: { orderIndex: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<Exam | null> {
    return this.examRepository.findOne({
      where: { id },
      relations: ['sections'],
      order: { sections: { orderIndex: 'ASC' } },
    });
  }

  async updateExam(code: string, examDate?: Date): Promise<Exam | null> {
    const exam = await this.findOneByCode(code);
    if (!exam) {
      return null;
    }

    if (examDate !== undefined) {
      exam.examDate = examDate;
      await this.examRepository.save(exam);
    }

    return exam;
  }
}
