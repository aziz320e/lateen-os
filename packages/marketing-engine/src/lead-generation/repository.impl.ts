/** Real, in-memory {@link MarketingLeadRepository} implementation. @module lead-generation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MarketingLead } from './types.js';
import type { MarketingLeadRepository } from './repository.js';

/** Creates a real, in-memory {@link MarketingLeadRepository}. */
export function createMarketingLeadRepository(seed?: readonly MarketingLead[]): MarketingLeadRepository {
  const repo = createInMemoryRepository<MarketingLead>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((lead) => lead.status === status);
    },
    async findBySource(organizationId, source) {
      return repo.list(organizationId).filter((lead) => lead.source === source);
    },
    async findByCampaign(organizationId, campaignId) {
      return repo.list(organizationId).filter((lead) => lead.campaignId === campaignId);
    },
  };
}
