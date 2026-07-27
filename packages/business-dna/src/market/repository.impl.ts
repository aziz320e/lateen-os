/** Real, in-memory {@link MarketModelRepository} implementation. @module market/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MarketModel } from './types.js';
import type { MarketModelRepository } from './repository.js';

/** Creates a real, in-memory {@link MarketModelRepository}. */
export function createMarketModelRepository(seed?: readonly MarketModel[]): MarketModelRepository {
  const repo = createInMemoryRepository<MarketModel>({ seed });
  return {
    ...repo,
    async findByOrganization(organizationId) {
      return repo.findById(organizationId, organizationId);
    },
  };
}
