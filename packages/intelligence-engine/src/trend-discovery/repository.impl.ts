/** Real in-memory {@link TrendRepository} implementation. @module trend-discovery/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { TrendId } from '../shared/identifiers.js';
import type { Trend } from './types.js';
import type { TrendRepository } from './repository.js';

export function createTrendRepository(seed?: readonly Trend[]): TrendRepository {
  const repo = createInMemoryRepository<Trend, TrendId>({ seed });
  return {
    ...repo,
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((trend) => trend.category === category);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((trend) => trend.status === status);
    },
  };
}
