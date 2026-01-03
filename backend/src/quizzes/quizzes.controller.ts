import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startQuiz(
    @GetUser('id') userId: string,
    @Body() startQuizDto: StartQuizDto,
  ) {
    const data = await this.quizzesService.startQuiz(userId, startQuizDto);
    return { success: true, data };
  }

  @Post(':quizId/answer')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('quizId') quizId: string,
    @GetUser('id') userId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    const data = await this.quizzesService.submitAnswer(quizId, userId, submitAnswerDto);
    return { success: true, data };
  }

  @Post(':quizId/complete')
  @HttpCode(HttpStatus.OK)
  async completeQuiz(
    @Param('quizId') quizId: string,
    @GetUser('id') userId: string,
  ) {
    const data = await this.quizzesService.completeQuiz(quizId, userId);
    return { success: true, data };
  }

  @Get(':quizId')
  @HttpCode(HttpStatus.OK)
  async getQuiz(
    @Param('quizId') quizId: string,
    @GetUser('id') userId: string,
  ) {
    const data = await this.quizzesService.getQuiz(quizId, userId);
    return { success: true, data };
  }
}
