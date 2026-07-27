/** Real, in-memory {@link TrendResultRepository} implementation. @module trend/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { TrendResultRepository } from './repository.js';
import type { TrendResult } from './types.js';

/** Creates a real, in-memory {@link TrendResultRepository}. */
export function createTrendResultRepository(seed?: readonly TrendResult[]): TrendResultRepository {
  const repo = createInMemoryRepository<TrendResult>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
