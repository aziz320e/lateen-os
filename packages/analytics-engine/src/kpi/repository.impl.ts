/** Real, in-memory {@link KpiSnapshotRepository} implementation. @module kpi/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { KpiSnapshotRepository } from './repository.js';
import type { KpiSnapshot } from './types.js';

/** Creates a real, in-memory {@link KpiSnapshotRepository}. */
export function createKpiSnapshotRepository(seed?: readonly KpiSnapshot[]): KpiSnapshotRepository {
  const repo = createInMemoryRepository<KpiSnapshot>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, kpiType) {
      return repo.list(organizationId).filter((snapshot) => snapshot.kpiType === kpiType);
    },
  };
}
