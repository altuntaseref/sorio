import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Subject } from '../subjects/entities/subject.entity';
import { Topic } from '../topics/entities/topic.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  async create(userId: string, createQuestionDto: CreateQuestionDto) {
    const { subjectId, topicId } = createQuestionDto;

    // 1. Verify subject exists AND belongs to user (or is a system subject)
    const subject = await this.subjectsRepository.findOne({
      where: [
        { id: subjectId, userId: userId },
        { id: subjectId, isSystem: true },
      ],
    });

    if (!subject) {
      throw new ForbiddenException(
        'Subject not found or you do not have access to it',
      );
    }

    // 2. Verify topic exists and belongs to the subject
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId, subject: { id: subjectId } },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found or does not belong to the selected subject');
    }

    // 3. Create question entity
    const question = this.questionsRepository.create({
      ...createQuestionDto,
      userId,
    });

    const savedQuestion = await this.questionsRepository.save(question);

    return {
      id: savedQuestion.id,
      name: savedQuestion.name,
      questionImageUrl: savedQuestion.questionImageUrl,
      correctAnswer: savedQuestion.correctAnswer,
      solutionNote: savedQuestion.solutionNote,
      solutionImageUrl: savedQuestion.solutionImageUrl,
      aiSolution: savedQuestion.aiSolution,
      subjectId: savedQuestion.subjectId,
      topicId: savedQuestion.topicId,
      createdAt: savedQuestion.createdAt,
    };
  }
}
