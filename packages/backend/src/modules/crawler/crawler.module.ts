import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  providers: [CrawlerService],
})
export class CrawlerModule {}
