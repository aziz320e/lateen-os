/** Real, in-memory Customer Health repository. @module health/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { HealthSnapshotRepository } from './repository.js';
import type { HealthSnapshot } from './types.js';

/** Creates a real, in-memory {@link HealthSnapshotRepository}. */
export function createHealthSnapshotRepository(seed?: readonly HealthSnapshot[]): HealthSnapshotRepository {
  const repo = createInMemoryRepository<HealthSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((snapshot) => snapshot.customerId === customerId);
    },
  };
}
