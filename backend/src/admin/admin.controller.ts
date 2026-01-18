import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { CreatePlanDto, UpdatePlanDto, UpdateUserPlanDto } from './dto/plan.dto';
import { CreateFeatureDto, UpdateFeatureDto } from './dto/feature.dto';
import { UpdatePlanLimitDto } from './dto/plan-limit.dto';

@Controller('admin')
@UseGuards(AdminTokenGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.adminService.getDashboardStats();
    return { data };
  }

  @Get('users')
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('planCode') planCode?: string,
  ) {
    const data = await this.adminService.listUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search,
      planCode,
    );
    return { data };
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') userId: string) {
    const data = await this.adminService.getUserDetail(userId);
    return { data };
  }

  @Patch('users/:id/plan')
  async updateUserPlan(@Param('id') userId: string, @Body() dto: UpdateUserPlanDto) {
    const data = await this.adminService.updateUserPlan(userId, dto);
    return { data };
  }

  @Get('plans')
  async getPlans() {
    const data = await this.adminService.getPlans();
    return { data };
  }

  @Post('plans')
  async createPlan(@Body() dto: CreatePlanDto) {
    const data = await this.adminService.createPlan(dto);
    return { data };
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') planId: string, @Body() dto: UpdatePlanDto) {
    const data = await this.adminService.updatePlan(planId, dto);
    return { data };
  }

  @Get('features')
  async getFeatures() {
    const data = await this.adminService.getFeatures();
    return { data };
  }

  @Post('features')
  async createFeature(@Body() dto: CreateFeatureDto) {
    const data = await this.adminService.createFeature(dto);
    return { data };
  }

  @Patch('features/:id')
  async updateFeature(@Param('id') featureId: string, @Body() dto: UpdateFeatureDto) {
    const data = await this.adminService.updateFeature(featureId, dto);
    return { data };
  }

  @Get('plan-limits')
  async getPlanLimits() {
    const data = await this.adminService.getPlanLimits();
    return { data };
  }

  @Patch('plan-limits')
  async updatePlanLimits(@Body() limits: UpdatePlanLimitDto[]) {
    const data = await this.adminService.updatePlanLimits(limits);
    return { data };
  }
}
