/** @module activity/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, SalesActivityId } from '../shared/identifiers.js';
import type { SalesActivity, SalesActivityType, SalesRelatedEntityType } from './types.js';

export interface SalesActivityRepository extends Repository<SalesActivity, SalesActivityId> {
  findAll(organizationId: OrganizationId): Promise<readonly SalesActivity[]>;
  findByType(organizationId: OrganizationId, activityType: SalesActivityType): Promise<readonly SalesActivity[]>;
  findByRelatedEntity(
    organizationId: OrganizationId,
    entityType: SalesRelatedEntityType,
    entityId: string,
  ): Promise<readonly SalesActivity[]>;
}
