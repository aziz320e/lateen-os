/** Real in-memory {@link MarketRepository} implementation. @module market-research/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MarketId } from '../shared/identifiers.js';
import type { Market } from './types.js';
import type { MarketRepository } from './repository.js';

export function createMarketRepository(seed?: readonly Market[]): MarketRepository {
  const repo = createInMemoryRepository<Market, MarketId>({ seed });
  return {
    ...repo,
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((market) => market.status === status);
    },
  };
}
