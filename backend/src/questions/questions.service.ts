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
import { GetQuestionsDto } from './dto/get-questions.dto';

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

    const topic = await this.topicsRepository.findOne({
      where: { id: topicId, subject: { id: subjectId } },
    });

    if (!topic) {
      throw new NotFoundException(
        'Topic not found or does not belong to the selected subject',
      );
    }

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

  async findAll(userId: string, getQuestionsDto: GetQuestionsDto) {
    const { page = 1, limit = 20, subjectId, topicId } = getQuestionsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.questionsRepository.createQueryBuilder('question');

    queryBuilder
      .where('question.userId = :userId', { userId })
      .leftJoinAndSelect('question.subject', 'subject')
      .leftJoinAndSelect('question.topic', 'topic')
      .leftJoinAndSelect('question.stats', 'stats')
      .orderBy('question.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (subjectId) {
      queryBuilder.andWhere('question.subjectId = :subjectId', { subjectId });
    }

    if (topicId) {
      queryBuilder.andWhere('question.topicId = :topicId', { topicId });
    }

    const [questions, total] = await queryBuilder.getManyAndCount();

    const formattedQuestions = questions.map((q) => {
      const stats = q.stats?.[0] || {
        totalAttempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastAttemptedAt: null,
      };

      const badges = {
        isMastered: stats.totalAttempts >= 10,
        hasNoErrors: stats.incorrectCount === 0 && stats.totalAttempts > 0,
        hasSomeErrors:
          stats.incorrectCount < stats.totalAttempts / 2 &&
          stats.incorrectCount > 0,
        hasManyErrors:
          stats.incorrectCount >= stats.totalAttempts / 2 &&
          stats.incorrectCount > 0,
      };

      return {
        id: q.id,
        name: q.name,
        questionImageUrl: q.questionImageUrl,
        correctAnswer: q.correctAnswer,
        solutionNote: q.solutionNote?.substring(0, 100),
        solutionImageUrl: q.solutionImageUrl,
        subjectName: q.subject.name,
        topicName: q.topic.name,
        createdAt: q.createdAt,
        stats,
        badges,
      };
    });

    return {
      questions: formattedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
