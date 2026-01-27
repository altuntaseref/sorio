import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { R2Service } from '../upload/r2.service';
import { PdfService } from './pdf.service';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { FeatureAccess } from '../pricing/decorators/feature-access.decorator';
import { FeatureAccessGuard } from '../pricing/guards/feature-access.guard';
import { FeatureUsageInterceptor } from '../pricing/interceptors/feature-usage.interceptor';
import { UseInterceptors } from '@nestjs/common';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly r2Service: R2Service,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, FeatureAccessGuard)
  @UseInterceptors(FeatureUsageInterceptor)
  @FeatureAccess('question_upload_limit')
  async create(
    @GetUser('id') userId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    const data = await this.questionsService.create(userId, createQuestionDto);

    return {
      message: 'Question created successfully',
      data,
    };
  }

  @Get()
  async findAll(
    @GetUser('id') userId: string,
    @Query() getQuestionsDto: GetQuestionsDto,
  ) {
    const data = await this.questionsService.findAll(userId, getQuestionsDto);
    return { data };
  }

  @Get(':id')
  async findOne(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.questionsService.findOne(userId, id);
    return { data };
  }

  @Put(':id')
  async update(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    const { updatedQuestion, oldImageKeys } = await this.questionsService.update(
      userId,
      id,
      updateQuestionDto,
    );

    if (oldImageKeys.length > 0) {
      Promise.all(
        oldImageKeys.map((key) => this.r2Service.deleteObject(key)),
      ).catch((error) => {
        // TODO: Add logging here to track if image deletion fails
        console.error('Failed to delete old images from R2:', error);
      });
    }

    return {
      message: 'Question updated successfully',
      data: { question: updatedQuestion },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const deletedQuestion = await this.questionsService.remove(userId, id);

    const keysToDelete: string[] = [];
    if (deletedQuestion.questionImageKey) {
      keysToDelete.push(deletedQuestion.questionImageKey);
    }
    if (deletedQuestion.solutionImageKey) {
      keysToDelete.push(deletedQuestion.solutionImageKey);
    }

    if (keysToDelete.length > 0) {
      Promise.all(
        keysToDelete.map((key) => this.r2Service.deleteObject(key)),
      ).catch((error) => {
        console.error(
          'Failed to delete images from R2 after question deletion:',
          error,
        );
      });
    }
  }

  /**
   * Seçilen soruları PDF formatında oluşturur, R2'ye yükler ve URL döner
   * POST /api/questions/generate-pdf
   */
  @Post('generate-pdf')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, FeatureAccessGuard)
  @UseInterceptors(FeatureUsageInterceptor)
  @FeatureAccess('pdf_export')
  async generatePdf(
    @GetUser('id') userId: string,
    @Body() generatePdfDto: GeneratePdfDto,
  ) {
    const result = await this.pdfService.generatePdf(
      userId,
      generatePdfDto.questionIds,
      {
        title: generatePdfDto.title || 'Sorular',
        questionsPerPage: generatePdfDto.questionsPerPage || 1,
        columns: generatePdfDto.columns || 1,
      },
      generatePdfDto.preview || false,
    );

    return {
      success: true,
      data: result,
    };
  }
}
