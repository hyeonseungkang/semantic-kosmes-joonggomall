import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchRequestDto } from '@kosmes/shared';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: '시맨틱 + GIS 통합 검색' })
  search(@Body() dto: SearchRequestDto) {
    return this.searchService.search(dto);
  }
}
