import { Controller, Get, Inject, Post, Body, Query } from '@nestjs/common';
import { SEARCH_SERVICE } from '../tokens';
import type { SearchService } from '../../application/search.service';
import { searchRequestSchema } from '../../domain/schemas';
import { SEARCH_MODES, SEARCH_SOURCES } from '../../domain/types';

@Controller('api/search')
export class SearchController {
  constructor(@Inject(SEARCH_SERVICE) private readonly searchService: SearchService) {}

  @Post()
  async search(@Body() body: unknown) {
    const parsed = searchRequestSchema.parse(body);
    return this.searchService.search({
      query: parsed.query,
      mode: parsed.mode as SearchRequestMode,
      filters: parsed.filters as SearchFiltersType,
      limit: parsed.limit,
      offset: parsed.offset,
      userId: parsed.userId,
      correlationId: parsed.correlationId,
    });
  }

  @Get('suggestions')
  suggestions(@Query('q') q: string, @Query('organizationId') organizationId: string) {
    return this.searchService.suggestions(q ?? '', organizationId);
  }

  @Get('recent')
  recent(@Query('organizationId') organizationId: string, @Query('userId') userId: string) {
    return this.searchService.recent(organizationId, userId ?? 'anonymous');
  }

  @Get('saved')
  saved(@Query('organizationId') organizationId: string, @Query('userId') userId: string) {
    return this.searchService.saved(organizationId, userId ?? 'anonymous');
  }

  @Get('indexes')
  indexes() {
    return this.searchService.indexes();
  }

  @Get('modes')
  modes() {
    return { modes: SEARCH_MODES, sources: SEARCH_SOURCES };
  }
}

type SearchRequestMode = import('../../domain/types.js').SearchMode;
type SearchFiltersType = import('../../domain/types.js').SearchFilters;

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'search-platform' };
  }
}
