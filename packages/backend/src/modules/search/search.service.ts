import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SearchRequestDto, SearchResponseDto, ExtractedSpec } from '@kosmes/shared';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly aiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.aiBaseUrl = config.get<string>('AI_SERVICE_URL', 'http://localhost:8001');
  }

  async search(req: SearchRequestDto): Promise<SearchResponseDto> {
    try {
      const { data } = await axios.post<SearchResponseDto>(
        `${this.aiBaseUrl}/search/semantic`,
        req,
        { timeout: 15000 },
      );
      return data;
    } catch (e) {
      this.logger.error(`Search failed: ${(e as Error).message}`);
      return { results: [], total: 0 };
    }
  }

  async extractSpec(text: string): Promise<ExtractedSpec | undefined> {
    try {
      const { data } = await axios.post<ExtractedSpec>(
        `${this.aiBaseUrl}/extract/spec`,
        { text, context: 'demand' },
        { timeout: 10000 },
      );
      return data;
    } catch (e) {
      this.logger.warn(`Spec extraction failed: ${(e as Error).message}`);
      return undefined;
    }
  }

  async embedListing(listingId: string, text: string): Promise<string | null> {
    try {
      const { data } = await axios.post<{ embeddingId: string }>(
        `${this.aiBaseUrl}/embed/listing`,
        { listingId, text },
        { timeout: 10000 },
      );
      return data.embeddingId;
    } catch (e) {
      this.logger.error(`Embedding failed for ${listingId}: ${(e as Error).message}`);
      return null;
    }
  }

  async reverseMatch(listingId: string): Promise<void> {
    try {
      await axios.post(
        `${this.aiBaseUrl}/search/reverse-match`,
        { listingId },
        { timeout: 30000 },
      );
    } catch (e) {
      this.logger.warn(`Reverse match failed: ${(e as Error).message}`);
    }
  }
}
