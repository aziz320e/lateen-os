/** @module metrics/repository */
import type { CampaignId, OrganizationId } from '../shared/identifiers.js';
import type { MarketingMetricsCounters } from './types.js';

export interface MarketingMetricsRepository {
  save(counters: MarketingMetricsCounters): Promise<void>;
  findByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<MarketingMetricsCounters | null>;
  findAll(organizationId: OrganizationId): Promise<readonly MarketingMetricsCounters[]>;
}
