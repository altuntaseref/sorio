import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RevenueCatWebhookService } from './services/revenue-cat-webhook.service';
import { RevenueCatWebhookDto } from './dto/revenue-cat-webhook.dto';
import { RevenueCatAuthGuard } from './guards/revenue-cat-auth.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly revenueCatWebhookService: RevenueCatWebhookService,
  ) {}

  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RevenueCatAuthGuard)
  async handleRevenueCatWebhook(@Body() webhookDto: RevenueCatWebhookDto) {
    await this.revenueCatWebhookService.handleWebhook(webhookDto);
    return { success: true };
  }
}
