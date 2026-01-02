import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async findAllForUser(user: User): Promise<{ systemSubjects: Subject[]; customSubjects: Subject[] }> {
    const { id: userId, examTarget: userExamTarget } = user;

    // TEMPORARY TEST: Hardcode examTarget to 'TYT' to ensure system subjects are returned.
    const testExamTarget = 'TYT';

    // 1. Get System Subjects based on the hardcoded examTarget
    const systemSubjects = await this.subjectRepository.find({
      where: {
        isSystem: true,
        examTarget: testExamTarget, // Using the hardcoded value here
      },
      relations: ['topics'],
      order: {
        name: 'ASC',
        topics: {
          createdAt: 'ASC'
        }
      }
    });

    // 2. Get User's Custom Subjects (this remains the same)
    const customSubjects = await this.subjectRepository.find({
      where: {
        user: { id: userId },
        isSystem: false,
      },
      relations: ['topics'],
      order: {
        name: 'ASC',
        topics: {
          createdAt: 'ASC'
        }
      }
    });

    return { systemSubjects, customSubjects };
  }
}
