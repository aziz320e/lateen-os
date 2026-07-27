/** Real, in-memory {@link MetricSnapshotRepository} implementation. @module metrics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MetricSnapshotRepository } from './repository.js';
import type { MetricSnapshot } from './types.js';

/** Creates a real, in-memory {@link MetricSnapshotRepository}. */
export function createMetricSnapshotRepository(seed?: readonly MetricSnapshot[]): MetricSnapshotRepository {
  const repo = createInMemoryRepository<MetricSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByName(organizationId, metricName) {
      return repo.list(organizationId).filter((snapshot) => snapshot.metricName === metricName);
    },
    async findByType(organizationId, metricType) {
      return repo.list(organizationId).filter((snapshot) => snapshot.metricType === metricType);
    },
  };
}
