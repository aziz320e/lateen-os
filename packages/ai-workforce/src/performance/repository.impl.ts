/** Real in-memory {@link PerformanceMetricsRepository} implementation. @module performance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PerformanceMetrics } from './types.js';
import type { PerformanceMetricsRepository } from './repository.js';

/** Creates a real, in-memory {@link PerformanceMetricsRepository}. */
export function createPerformanceMetricsRepository(seed?: readonly PerformanceMetrics[]): PerformanceMetricsRepository {
  const repo = createInMemoryRepository<PerformanceMetrics>({ seed });
  return {
    ...repo,
    async findByWorker(organizationId, workerId) {
      return repo.list(organizationId).filter((metrics) => metrics.workerId === workerId);
    },
  };
}
