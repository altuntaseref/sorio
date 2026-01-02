import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') userId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    const question = await this.questionsService.create(
      userId,
      createQuestionDto,
    );

    return {
      success: true,
      message: 'Question created successfully',
      data: {
        question,
      },
    };
  }
}
