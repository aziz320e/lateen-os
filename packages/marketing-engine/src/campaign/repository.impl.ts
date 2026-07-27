/** Real, in-memory {@link CampaignRepository} implementation. @module campaign/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Campaign } from './types.js';
import type { CampaignRepository } from './repository.js';

/** Creates a real, in-memory {@link CampaignRepository}. */
export function createCampaignRepository(seed?: readonly Campaign[]): CampaignRepository {
  const repo = createInMemoryRepository<Campaign>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((campaign) => campaign.status === status);
    },
    async findByType(organizationId, campaignType) {
      return repo.list(organizationId).filter((campaign) => campaign.campaignType === campaignType);
    },
  };
}
