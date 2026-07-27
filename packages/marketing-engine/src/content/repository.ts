/** @module content/repository */
import type { Repository } from '../shared/repository.js';
import type { CampaignId, ContentItemId, OrganizationId } from '../shared/identifiers.js';
import type { ContentItem, ContentStatus, ContentType } from './types.js';

export interface ContentRepository extends Repository<ContentItem, ContentItemId> {
  findAll(organizationId: OrganizationId): Promise<readonly ContentItem[]>;
  findByType(organizationId: OrganizationId, contentType: ContentType): Promise<readonly ContentItem[]>;
  findByStatus(organizationId: OrganizationId, status: ContentStatus): Promise<readonly ContentItem[]>;
  findByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly ContentItem[]>;
}
