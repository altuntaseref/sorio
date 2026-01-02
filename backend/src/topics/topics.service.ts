import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { CreateTopicDto } from '../subjects/dto/create-topic.dto';
import { SubjectsService } from '../subjects/subjects.service';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @Inject(forwardRef(() => SubjectsService))
    private readonly subjectsService: SubjectsService,
  ) {}

  async create(
    createTopicDto: CreateTopicDto,
    subjectId: string,
    userId: string,
  ): Promise<Topic> {
    const subject = await this.subjectsService.findOne(subjectId, userId);

    const topic = this.topicsRepository.create({
      ...createTopicDto,
      subject,
    });

    return this.topicsRepository.save(topic);
  }

  async findOneByName(name: string, subjectId: string): Promise<Topic | null | undefined> {
    return this.topicsRepository.findOne({ where: { name, subject: { id: subjectId } } });
  }
}
