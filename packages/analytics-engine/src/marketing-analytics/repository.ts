/** @module marketing-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { MarketingAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { MarketingAnalyticsSnapshot } from './types.js';

export interface MarketingAnalyticsRepository extends Repository<MarketingAnalyticsSnapshot, MarketingAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly MarketingAnalyticsSnapshot[]>;
}
