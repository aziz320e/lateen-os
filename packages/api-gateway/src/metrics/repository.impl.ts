/** Real, in-memory Request Metrics and Health Snapshot repositories. @module metrics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { HealthSnapshotRepository, RequestMetricRepository } from './repository.js';
import type { HealthSnapshot, RequestMetric } from './types.js';

/** Creates a real, in-memory {@link RequestMetricRepository}. */
export function createRequestMetricRepository(seed?: readonly RequestMetric[]): RequestMetricRepository {
  const repo = createInMemoryRepository<RequestMetric>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByPath(organizationId, path) {
      return repo.list(organizationId).filter((metric) => metric.path === path);
    },
  };
}

/** Creates a real, in-memory {@link HealthSnapshotRepository}. */
export function createHealthSnapshotRepository(seed?: readonly HealthSnapshot[]): HealthSnapshotRepository {
  const repo = createInMemoryRepository<HealthSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByService(organizationId, serviceName) {
      return repo.list(organizationId).filter((snapshot) => snapshot.serviceName === serviceName);
    },
  };
}
