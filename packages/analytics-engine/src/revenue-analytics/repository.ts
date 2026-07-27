/** @module revenue-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, RevenueAnalyticsId } from '../shared/identifiers.js';
import type { RevenueAnalyticsSnapshot } from './types.js';

export interface RevenueAnalyticsRepository extends Repository<RevenueAnalyticsSnapshot, RevenueAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly RevenueAnalyticsSnapshot[]>;
}
