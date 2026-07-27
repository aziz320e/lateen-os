/** @module security-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, SecurityAnalyticsId } from '../shared/identifiers.js';
import type { SecurityAnalyticsSnapshot } from './types.js';

export interface SecurityAnalyticsRepository extends Repository<SecurityAnalyticsSnapshot, SecurityAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly SecurityAnalyticsSnapshot[]>;
}
