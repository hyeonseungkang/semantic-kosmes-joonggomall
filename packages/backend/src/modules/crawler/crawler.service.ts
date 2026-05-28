import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private running = false;

  constructor(private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async runCrawl() {
    if (this.running) {
      this.logger.warn('Crawler already running, skipping this tick');
      return;
    }
    this.running = true;
    this.logger.log('Starting crawl job...');
    try {
      const aiUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8001');
      await axios.post(`${aiUrl}/crawler/run`, {}, { timeout: 300_000 });
      this.logger.log('Crawl job completed');
    } catch (e) {
      this.logger.error(`Crawl job failed: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
