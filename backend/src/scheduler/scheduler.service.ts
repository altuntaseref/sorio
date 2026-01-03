import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron('0 * * * *') // Runs every hour
  async handleCron() {
    this.logger.log('Refreshing weekly_activity materialized view...');
    try {
      await this.dataSource.query('REFRESH MATERIALIZED VIEW weekly_activity');
      this.logger.log('Successfully refreshed weekly_activity materialized view.');
    } catch (error) {
      this.logger.error('Failed to refresh weekly_activity materialized view:', error.stack);
    }
  }
}
