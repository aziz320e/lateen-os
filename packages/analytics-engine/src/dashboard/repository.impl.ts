/** Real, in-memory {@link DashboardRepository} implementation. @module dashboard/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DashboardRepository } from './repository.js';
import type { Dashboard } from './types.js';

/** Creates a real, in-memory {@link DashboardRepository}. */
export function createDashboardRepository(seed?: readonly Dashboard[]): DashboardRepository {
  const repo = createInMemoryRepository<Dashboard>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, dashboardType) {
      return repo.list(organizationId).filter((dashboard) => dashboard.dashboardType === dashboardType);
    },
  };
}
