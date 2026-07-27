/** @module campaign/repository */
import type { Repository } from '../shared/repository.js';
import type { CampaignId, OrganizationId } from '../shared/identifiers.js';
import type { Campaign, CampaignStatus, CampaignType } from './types.js';

export interface CampaignRepository extends Repository<Campaign, CampaignId> {
  findAll(organizationId: OrganizationId): Promise<readonly Campaign[]>;
  findByStatus(organizationId: OrganizationId, status: CampaignStatus): Promise<readonly Campaign[]>;
  findByType(organizationId: OrganizationId, campaignType: CampaignType): Promise<readonly Campaign[]>;
}
