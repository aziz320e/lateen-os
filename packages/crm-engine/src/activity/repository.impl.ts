/** Real, in-memory {@link ActivityRepository} implementation. @module activity/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Activity } from './types.js';
import type { ActivityRepository } from './repository.js';

/** Creates a real, in-memory {@link ActivityRepository}. */
export function createActivityRepository(seed?: readonly Activity[]): ActivityRepository {
  const repo = createInMemoryRepository<Activity>({ seed });
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
