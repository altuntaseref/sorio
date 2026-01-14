import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MockExamsService } from './mock-exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { SetExamTargetsDto } from './dto/set-exam-targets.dto';
import { SetExamGoalDto } from './dto/set-exam-goal.dto';
import { CreateMockExamDto } from './dto/create-mock-exam.dto';

@Controller('mock-exams')
@UseGuards(JwtAuthGuard)
export class MockExamsController {
  constructor(private readonly mockExamsService: MockExamsService) {}

  // Kullanıcının sınav hedeflerini ayarla
  @Post('targets')
  async setExamTargets(
    @GetUser() user: User,
    @Body() dto: SetExamTargetsDto,
  ) {
    const targets = await this.mockExamsService.setExamTargets(
      user.id,
      dto,
    );
    return {
      success: true,
      data: { targets },
    };
  }

  // Kullanıcının sınav hedeflerini getir
  @Get('targets')
  async getExamTargets(@GetUser() user: User) {
    const targets = await this.mockExamsService.getExamTargets(user.id);
    return {
      success: true,
      data: { targets },
    };
  }

  // Hedef net belirle/güncelle
  @Post('goals')
  async setExamGoal(@GetUser() user: User, @Body() dto: SetExamGoalDto) {
    const goal = await this.mockExamsService.setExamGoal(user.id, dto);
    return {
      success: true,
      data: { goal },
    };
  }

  // Hedef netleri getir
  @Get('goals')
  async getExamGoals(@GetUser() user: User) {
    const goals = await this.mockExamsService.getExamGoals(user.id);
    return {
      success: true,
      data: { goals },
    };
  }

  // Sınavın derslerini getir
  @Get('subjects')
  async getSubjectsByExamCode(@Query('examCode') examCode: string) {
    if (!examCode) {
      return {
        success: false,
        message: 'examCode query parameter is required',
      };
    }

    const subjects = await this.mockExamsService.getSubjectsByExamCode(
      examCode,
    );
    return {
      success: true,
      data: { subjects },
    };
  }

  // Deneme sınavı kaydet
  @Post()
  async createMockExam(@GetUser() user: User, @Body() dto: CreateMockExamDto) {
    const mockExam = await this.mockExamsService.createMockExam(
      user.id,
      dto,
    );
    return {
      success: true,
      data: { mockExam },
    };
  }

  // Deneme sınavlarını listele
  @Get()
  async getMockExams(
    @GetUser() user: User,
    @Query('examCode') examCode?: string,
  ) {
    const mockExams = await this.mockExamsService.getMockExams(
      user.id,
      examCode,
    );
    return {
      success: true,
      data: { mockExams },
    };
  }

  // Deneme sınavı detayı
  @Get(':id')
  async getMockExamById(@GetUser() user: User, @Param('id') id: string) {
    const mockExam = await this.mockExamsService.getMockExamById(user.id, id);
    return {
      success: true,
      data: { mockExam },
    };
  }

  // Gelişim grafiği
  @Get('progress/:examCode')
  async getProgress(@GetUser() user: User, @Param('examCode') examCode: string) {
    const progress = await this.mockExamsService.getProgress(
      user.id,
      examCode,
    );
    return {
      success: true,
      data: { progress },
    };
  }
}
