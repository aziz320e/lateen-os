/** @module lead-generation/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CampaignId, MarketingLeadId } from '../shared/identifiers.js';
import type { ISODateTime, MarketingTag } from '../shared/primitives.js';

export type { MarketingLeadId };

/** Deterministic lead generation channel. */
export type LeadSource = 'inbound' | 'outbound' | 'referral' | 'event' | 'manual_import';

export type MarketingLeadStatus = 'new' | 'archived';

/** A lead captured by a marketing generation channel, optionally attributable to a campaign. */
export interface MarketingLead extends TenantAuditableEntity<MarketingLeadId> {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly source: LeadSource;
  readonly campaignId?: CampaignId;
  readonly status: MarketingLeadStatus;
  /** 0-100. Set/refreshed by the Lead Scoring engine. */
  readonly score?: number;
  /** 0-100 input factor — how engaged this lead has been (opens, clicks, replies). */
  readonly engagementScore?: number;
  /** 0-100 input factor — how complete this lead's captured profile is. */
  readonly profileCompletenessPct?: number;
  /** Input factor — number of recorded interactions with this lead. */
  readonly activityCount?: number;
  readonly lastActivityAt?: ISODateTime;
  readonly tags: readonly MarketingTag[];
}

export type { OrganizationId } from '../shared/identifiers.js';
