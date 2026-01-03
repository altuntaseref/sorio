import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Param } from '@nestjs/common';
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
}
