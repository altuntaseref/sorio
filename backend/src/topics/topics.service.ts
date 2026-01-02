import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { CreateTopicDto } from '../subjects/dto/create-topic.dto';
import { SubjectsService } from '../subjects/subjects.service';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { User } from '../users/entities/user.entity';

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

  async update(
    topicId: string,
    updateTopicDto: UpdateTopicDto,
    user: User,
  ): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({ where: { id: topicId }, relations: ['subject'] });

    if (!topic) {
      throw new NotFoundException(`Topic with ID \"${topicId}\" not found`);
    }

    if (topic.subject.isSystem) {
      throw new ForbiddenException('System topics cannot be updated.');
    }

    if (topic.subject.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this topic.');
    }

    if (updateTopicDto.name && updateTopicDto.name !== topic.name) {
      const existingTopic = await this.findOneByName(updateTopicDto.name, topic.subject.id);
      if (existingTopic) {
        throw new ConflictException(`Topic with name \'${updateTopicDto.name}\' already exists in this subject.`);
      }
    }

    Object.assign(topic, updateTopicDto);
    return this.topicsRepository.save(topic);
  }

  async remove(topicId: string, user: User): Promise<void> {
    const topic = await this.topicsRepository.findOne({ where: { id: topicId }, relations: ['subject'] });

    if (!topic) {
      throw new NotFoundException(`Topic with ID \"${topicId}\" not found`);
    }

    if (topic.subject.isSystem) {
      throw new ForbiddenException('System topics cannot be deleted.');
    }

    if (topic.subject.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this topic.');
    }

    await this.topicsRepository.remove(topic);
  }
}
