
import { Controller, Get, Post, Put, Delete, Body, UseGuards, Query, Param, ParseUUIDPipe, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubjectsService } from './subjects.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto'; // Import UpdateSubjectDto
import { CreateTopicDto } from './dto/create-topic.dto';
import { TopicsService } from '../topics/topics.service';
import { UsersService } from '../users/users.service';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly topicsService: TopicsService,
    private readonly usersService: UsersService,
    ) {}

  @Post()
  async create(
    @Body() createSubjectDto: CreateSubjectDto,
    @GetUser() user: User,
  ) {
    const subject = await this.subjectsService.create(createSubjectDto, user);

    return {
      success: true,
      data: {
        subject: {
          id: subject.id,
          name: subject.name,
          userId: user.id,
          isSystem: subject.isSystem,
          createdAt: subject.createdAt,
        },
      },
    };
  }

  @Post('custom')
  async createCustom(
    @Body() createSubjectDto: CreateSubjectDto,
    @GetUser() user: User,
  ) {
    // Same as create endpoint, just an alias for /custom
    return this.create(createSubjectDto, user);
  }

  @Post(':subjectId/topics')
  async addTopic(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Body() createTopicDto: CreateTopicDto,
    @GetUser() user: User,
  ) {
    const subject = await this.subjectsService.findOne(subjectId, user.id);

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (subject.userId !== user.id && !subject.isSystem) {
      throw new ForbiddenException('You are not authorized to add a topic to this subject');
    }

    const existingTopic = await this.topicsService.findOneByName(createTopicDto.name, subjectId);

    if (existingTopic) {
      throw new ConflictException('Topic with this name already exists for this subject');
    }

    const topic = await this.topicsService.create(createTopicDto, subjectId, user.id);

    return {
      success: true,
      data: {
        topic: {
          id: topic.id,
          name: topic.name,
          subjectId: topic.subject.id,
          createdAt: topic.createdAt,
        },
      },
    };
  }

  @Get()
  async findAllForUser(
    @GetUser() user: User,
    @Query('examCode') examCode?: string,
    @Query('examTarget') examTarget?: string,
  ) {
    const resolvedExamCode = await this.usersService.resolveExamCode(
      user.id,
      examCode ?? examTarget,
    );
    const { systemSubjects, customSubjects } =
      await this.subjectsService.findAllForUser(user, resolvedExamCode);

    return {
      success: true,
      data: {
        systemSubjects,
        customSubjects,
      }
    };
  }

  @Get('default')
  async findDefaultSubjects(
    @GetUser() user: User,
    @Query('examCode') examCode?: string,
    @Query('examTarget') examTarget?: string,
  ) {
    const resolvedExamCode = await this.usersService.resolveExamCode(
      user.id,
      examCode ?? examTarget,
    );

    if (!resolvedExamCode) {
      return { subjects: [] };
    }

    const subjects =
      await this.subjectsService.findDefaultByExamCode(resolvedExamCode);
    return { subjects };
  }

  @Put(':subjectId')
  async update(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @GetUser() user: User,
  ) {
    const updatedSubject = await this.subjectsService.update(subjectId, updateSubjectDto, user);
    return {
      success: true,
      data: {
        subject: updatedSubject,
      },
    };
  }

  @Delete(':subjectId')
  async remove(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @GetUser() user: User,
  ) {
    await this.subjectsService.remove(subjectId, user);
    return {
      success: true,
      message: 'Subject deleted successfully',
    };
  }
}
