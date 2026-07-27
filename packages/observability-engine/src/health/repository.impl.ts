/** Real, in-memory {@link HealthCheckRepository} implementation. @module health/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { HealthCheckRepository } from './repository.js';
import type { HealthCheck } from './types.js';

/** Creates a real, in-memory {@link HealthCheckRepository}. */
export function createHealthCheckRepository(seed?: readonly HealthCheck[]): HealthCheckRepository {
  const repo = createInMemoryRepository<HealthCheck>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByComponent(organizationId, component) {
      return repo.list(organizationId).filter((check) => check.component === component);
    },
  };
}
