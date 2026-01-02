import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, user: User): Promise<Subject> {
    const { name } = createSubjectDto;

    const existingSubject = await this.subjectRepository.findOne({
      where: { name, user: { id: user.id } },
    });

    if (existingSubject) {
      throw new ConflictException(`Subject with name \'${name}\' already exists.`);
    }

    const newSubject = this.subjectRepository.create({
      name,
      user,
      isSystem: false,
      examTarget: null,
    });

    return this.subjectRepository.save(newSubject);
  }

  async findOne(id: string, userId: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: [
        { id, user: { id: userId } },
        { id, isSystem: true },
      ],
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID \"${id}\" not found`);
    }

    return subject;
  }

  async findAllForUser(user: User): Promise<{ systemSubjects: Subject[]; customSubjects: Subject[] }> {
    const { id: userId, examTarget: userExamTarget } = user;

    const systemSubjects = await this.subjectRepository.find({
      where: { isSystem: true, examTarget: userExamTarget },
      relations: ['topics'],
      order: { name: 'ASC', topics: { createdAt: 'ASC' } },
    });

    const customSubjects = await this.subjectRepository.find({
      where: { user: { id: userId }, isSystem: false },
      relations: ['topics'],
      order: { name: 'ASC', topics: { createdAt: 'ASC' } },
    });

    return { systemSubjects, customSubjects };
  }

  async findDefaultByExamTarget(examTarget: string): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: {
        isSystem: true,
        examTarget: examTarget,
      },
      relations: ['topics'],
      order: {
        name: 'ASC',
        topics: {
          createdAt: 'ASC',
        },
      },
    });
  }

  async update(
    subjectId: string,
    updateSubjectDto: UpdateSubjectDto,
    user: User,
  ): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id: subjectId } });

    if (!subject) {
      throw new NotFoundException(`Subject with ID \"${subjectId}\" not found`);
    }

    if (subject.isSystem) {
      throw new ForbiddenException('System subjects cannot be updated.');
    }

    if (subject.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this subject.');
    }

    if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
      const existingSubject = await this.subjectRepository.findOne({
        where: { name: updateSubjectDto.name, user: { id: user.id } },
      });

      if (existingSubject) {
        throw new ConflictException(`Subject with name \'${updateSubjectDto.name}\' already exists.`);
      }
    }

    Object.assign(subject, updateSubjectDto);
    return this.subjectRepository.save(subject);
  }

  async remove(subjectId: string, user: User): Promise<void> {
    const subject = await this.subjectRepository.findOne({ where: { id: subjectId } });

    if (!subject) {
      throw new NotFoundException(`Subject with ID \"${subjectId}\" not found`);
    }

    if (subject.isSystem) {
      throw new ForbiddenException('System subjects cannot be deleted.');
    }

    if (subject.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this subject.');
    }

    await this.subjectRepository.remove(subject);
  }
}
