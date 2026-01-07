import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@GetUser() user: any) {
    const userId = user.id || user; // Fallback: eğer direkt string gelirse onu kullan
    const data = await this.dashboardService.getDashboard(userId);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
    };
  }
}

