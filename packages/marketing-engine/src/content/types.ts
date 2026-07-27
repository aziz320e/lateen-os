/** @module content/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CampaignId, ContentItemId } from '../shared/identifiers.js';
import type { MarketingTag } from '../shared/primitives.js';

export type { ContentItemId };

/** Deterministic content-library item kind. */
export type ContentType = 'template' | 'asset' | 'landing_page' | 'media_reference';

export type ContentStatus = 'draft' | 'published' | 'archived';

/** A managed content-library item — a template, a campaign asset, a landing page, or a media reference. */
export interface ContentItem extends TenantAuditableEntity<ContentItemId> {
  readonly title: string;
  readonly contentType: ContentType;
  readonly status: ContentStatus;
  readonly campaignId?: CampaignId;
  readonly body?: string;
  readonly url?: string;
  readonly tags: readonly MarketingTag[];
}

export type { OrganizationId } from '../shared/identifiers.js';
