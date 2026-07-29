/** Real, in-memory Dashboard Snapshot repository. @module dashboard/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DashboardSnapshotRepository } from './repository.js';
import type { DashboardSnapshot } from './types.js';

/** Creates a real, in-memory {@link DashboardSnapshotRepository}. */
export function createDashboardSnapshotRepository(seed?: readonly DashboardSnapshot[]): DashboardSnapshotRepository {
  const repo = createInMemoryRepository<DashboardSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
