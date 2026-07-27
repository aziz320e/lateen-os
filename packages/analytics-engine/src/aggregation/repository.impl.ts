/** Real, in-memory {@link AggregationResultRepository} implementation. @module aggregation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AggregationResultRepository } from './repository.js';
import type { AggregationResult } from './types.js';

/** Creates a real, in-memory {@link AggregationResultRepository}. */
export function createAggregationResultRepository(seed?: readonly AggregationResult[]): AggregationResultRepository {
  const repo = createInMemoryRepository<AggregationResult>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
