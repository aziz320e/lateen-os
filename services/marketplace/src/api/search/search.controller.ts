import { Controller, Get, Inject, Query } from '@nestjs/common';
import { SEARCH_SERVICE } from '../tokens';
import type { SearchService } from '../../application/marketplace.services';
import type { MarketplaceExtensionCategory, ReleaseChannel } from '../../domain/types';

@Controller('api/search')
export class SearchController {
  constructor(@Inject(SEARCH_SERVICE) private readonly search: SearchService) {}

  @Get()
  searchExtensions(
    @Query('q') query?: string,
    @Query('category') category?: MarketplaceExtensionCategory,
    @Query('publisher') publisher?: string,
    @Query('industry') industry?: string,
    @Query('capability') capability?: string,
    @Query('connector') connector?: string,
    @Query('aiWorker') aiWorker?: string,
    @Query('channel') channel?: ReleaseChannel,
    @Query('tag') tag?: string | string[],
  ) {
    const tags = tag ? (Array.isArray(tag) ? tag : [tag]) : undefined;
    return this.search.search({
      query,
      category,
      publisher,
      industry,
      capability,
      connector: connector ? connector : undefined,
      aiWorker: aiWorker === 'true',
      channel,
      tags,
    });
  }
}
