/** @module campaign/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CampaignId, EmployeeId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODateTime, MarketingTag } from '../shared/primitives.js';

export type { CampaignId };

/** Deterministic campaign channel/type. */
export type CampaignType =
  | 'email'
  | 'social'
  | 'sms'
  | 'whatsapp'
  | 'webinar'
  | 'event'
  | 'paid_ads'
  | 'organic'
  | 'referral';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

/** A marketing campaign moving through a guarded, deterministic lifecycle. */
export interface Campaign extends TenantAuditableEntity<CampaignId> {
  readonly name: string;
  readonly campaignType: CampaignType;
  readonly status: CampaignStatus;
  readonly ownerId?: EmployeeId;
  readonly budget?: string;
  readonly currency?: CurrencyCode;
  readonly scheduledAt?: ISODateTime;
  readonly endAt?: ISODateTime;
  readonly launchedAt?: ISODateTime;
  readonly pausedAt?: ISODateTime;
  readonly completedAt?: ISODateTime;
  readonly tags: readonly MarketingTag[];
}

export type { OrganizationId } from '../shared/identifiers.js';
