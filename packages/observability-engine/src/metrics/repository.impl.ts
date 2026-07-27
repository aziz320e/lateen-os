/** Real, in-memory {@link MetricSampleRepository} implementation. @module metrics/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MetricSampleRepository } from './repository.js';
import type { MetricSample } from './types.js';

/** Creates a real, in-memory {@link MetricSampleRepository}. */
export function createMetricSampleRepository(seed?: readonly MetricSample[]): MetricSampleRepository {
  const repo = createInMemoryRepository<MetricSample>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByName(organizationId, metricName) {
      return repo.list(organizationId).filter((sample) => sample.metricName === metricName);
    },
    async findByType(organizationId, metricType) {
      return repo.list(organizationId).filter((sample) => sample.metricType === metricType);
    },
  };
}
