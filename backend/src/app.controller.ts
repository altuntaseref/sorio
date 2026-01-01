import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck(): object {
    return { status: 'ok', message: 'pong' };
  }
}
