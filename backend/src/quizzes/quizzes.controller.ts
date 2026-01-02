import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

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
}
