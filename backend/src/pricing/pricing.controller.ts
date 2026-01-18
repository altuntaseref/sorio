import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('mobile')
  async getMobilePricing(@GetUser('id') userId: string) {
    const data = await this.pricingService.getMobilePricing(userId);
    return { data };
  }
}
