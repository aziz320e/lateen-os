/** @module lead-generation/repository */
import type { Repository } from '../shared/repository.js';
import type { CampaignId, MarketingLeadId, OrganizationId } from '../shared/identifiers.js';
import type { LeadSource, MarketingLead, MarketingLeadStatus } from './types.js';

export interface MarketingLeadRepository extends Repository<MarketingLead, MarketingLeadId> {
  findAll(organizationId: OrganizationId): Promise<readonly MarketingLead[]>;
  findByStatus(organizationId: OrganizationId, status: MarketingLeadStatus): Promise<readonly MarketingLead[]>;
  findBySource(organizationId: OrganizationId, source: LeadSource): Promise<readonly MarketingLead[]>;
  findByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly MarketingLead[]>;
}
