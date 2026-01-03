import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AnalyticsService } from './analytics.service';
import { GetWeeklyActivityDto } from './dto/get-weekly-activity.dto';
import { User } from '../users/entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getAnalyticsOverview(@GetUser('id') userId: string) {
    const data = await this.analyticsService.getAnalyticsOverview(userId);
    return { success: true, data };
  }

  @Get('weekly-activity')
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
  async getSubjectStatistics(@GetUser('id') userId: string) {
    const data = await this.analyticsService.getSubjectStatistics(userId);
    return { success: true, data };
  }
}
