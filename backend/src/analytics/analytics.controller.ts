import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AnalyticsService } from './analytics.service';
import { GetWeeklyActivityDto } from './dto/get-weekly-activity.dto';
import { AnalysisRangeDto } from './dto/analysis-range.dto';
import { User } from '../users/entities/user.entity';
import { FeatureAccess } from '../pricing/decorators/feature-access.decorator';
import { FeatureAccessGuard } from '../pricing/guards/feature-access.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('basic_analytics')
  async getAnalyticsOverview(@GetUser('id') userId: string) {
    const data = await this.analyticsService.getAnalyticsOverview(userId);
    return { success: true, data };
  }

  @Get('weekly-activity')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('basic_analytics')
  getWeeklyActivity(
    @GetUser() user: User,
    @Query() getWeeklyActivityDto: GetWeeklyActivityDto,
  ) {
    return this.analyticsService.getWeeklyActivity(
      user.id,
      getWeeklyActivityDto.weeks,
    );
  }

  @Get('subjects')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('basic_analytics')
  async getSubjectStatistics(@GetUser('id') userId: string) {
    const data = await this.analyticsService.getSubjectStatistics(userId);
    return { success: true, data };
  }

  @Get('general')
  async getGeneralAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
  ) {
    const data = await this.analyticsService.getAnalysisGeneral(
      userId,
      rangeDto.range,
    );
    return { success: true, data };
  }

  @Get('questions')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getQuestionAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
  ) {
    const data = await this.analyticsService.getAnalysisQuestions(
      userId,
      rangeDto.range,
    );
    return { success: true, data };
  }

  @Get('time')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('advanced_analytics')
  async getTimeAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
  ) {
    const data = await this.analyticsService.getAnalysisTime(
      userId,
      rangeDto.range,
    );
    return { success: true, data };
  }

  @Get('exams')
  @UseGuards(FeatureAccessGuard)
  @FeatureAccess('mock_exam_analytics')
  async getExamAnalysis(
    @GetUser('id') userId: string,
    @Query() rangeDto: AnalysisRangeDto,
    @Query('examCode') examCode?: string,
  ) {
    const data = await this.analyticsService.getAnalysisExams(
      userId,
      rangeDto.range,
      examCode,
    );
    return { success: true, data };
  }
}
