/** Real, in-memory {@link SalesActivityRepository} implementation. @module activity/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SalesActivity } from './types.js';
import type { SalesActivityRepository } from './repository.js';

/** Creates a real, in-memory {@link SalesActivityRepository}. */
export function createSalesActivityRepository(seed?: readonly SalesActivity[]): SalesActivityRepository {
  const repo = createInMemoryRepository<SalesActivity>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, activityType) {
      return repo.list(organizationId).filter((activity) => activity.activityType === activityType);
    },
    async findByRelatedEntity(organizationId, entityType, entityId) {
      return repo
        .list(organizationId)
        .filter((activity) => activity.relatedTo.entityType === entityType && activity.relatedTo.entityId === entityId);
    },
  };
}
