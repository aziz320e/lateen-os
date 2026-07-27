/** Real, in-memory {@link PerformanceSampleRepository} implementation. @module performance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PerformanceSampleRepository } from './repository.js';
import type { PerformanceSample } from './types.js';

/** Creates a real, in-memory {@link PerformanceSampleRepository}. */
export function createPerformanceSampleRepository(seed?: readonly PerformanceSample[]): PerformanceSampleRepository {
  const repo = createInMemoryRepository<PerformanceSample>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByMetric(organizationId, metric) {
      return repo.list(organizationId).filter((sample) => sample.metric === metric);
    },
  };
}
