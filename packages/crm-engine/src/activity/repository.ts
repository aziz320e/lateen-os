/** @module activity/repository */
import type { Repository } from '../shared/repository.js';
import type { ActivityId, OrganizationId } from '../shared/identifiers.js';
import type { Activity, ActivityType, RelatedEntityType } from './types.js';

export interface ActivityRepository extends Repository<Activity, ActivityId> {
  findAll(organizationId: OrganizationId): Promise<readonly Activity[]>;
  findByType(organizationId: OrganizationId, activityType: ActivityType): Promise<readonly Activity[]>;
  findByRelatedEntity(organizationId: OrganizationId, entityType: RelatedEntityType, entityId: string): Promise<readonly Activity[]>;
}
