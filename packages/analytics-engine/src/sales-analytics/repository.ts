/** @module sales-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, SalesAnalyticsId } from '../shared/identifiers.js';
import type { SalesAnalyticsSnapshot } from './types.js';

export interface SalesAnalyticsRepository extends Repository<SalesAnalyticsSnapshot, SalesAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly SalesAnalyticsSnapshot[]>;
}
