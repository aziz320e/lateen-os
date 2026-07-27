/** @module queries/types */
import type { Audience, AudienceStatus, AudienceType } from '../audience/types.js';
import type { Campaign, CampaignStatus, CampaignType } from '../campaign/types.js';
import type { CalendarEntry } from '../calendar/types.js';
import type { ContentItem, ContentStatus, ContentType } from '../content/types.js';
import type { LeadSource, MarketingLead, MarketingLeadStatus } from '../lead-generation/types.js';
import type { MarketingMetricsSnapshot } from '../metrics/types.js';
import type { CampaignId, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindCampaignsQuery extends OrganizationScopedQuery {
  readonly status?: CampaignStatus;
  readonly campaignType?: CampaignType;
}
export interface FindCampaignsResult {
  readonly campaigns: readonly Campaign[];
  readonly total: number;
}

export interface FindAudiencesQuery extends OrganizationScopedQuery {
  readonly audienceType?: AudienceType;
  readonly status?: AudienceStatus;
}
export interface FindAudiencesResult {
  readonly audiences: readonly Audience[];
  readonly total: number;
}

export interface FindAssetsQuery extends OrganizationScopedQuery {
  readonly campaignId?: CampaignId;
}
export interface FindAssetsResult {
  readonly assets: readonly ContentItem[];
  readonly total: number;
}

export interface FindContentQuery extends OrganizationScopedQuery {
  readonly contentType?: ContentType;
  readonly status?: ContentStatus;
  readonly campaignId?: CampaignId;
}
export interface FindContentResult {
  readonly content: readonly ContentItem[];
  readonly total: number;
}

export interface FindLeadsQuery extends OrganizationScopedQuery {
  readonly source?: LeadSource;
  readonly status?: MarketingLeadStatus;
  readonly campaignId?: CampaignId;
  readonly minScore?: number;
}
export interface FindLeadsResult {
  readonly leads: readonly MarketingLead[];
  readonly total: number;
}

export interface FindMetricsQuery extends OrganizationScopedQuery {
  readonly campaignId?: CampaignId;
}
export interface FindMetricsResult {
  readonly metrics: readonly MarketingMetricsSnapshot[];
  readonly total: number;
}

export interface FindCalendarQuery extends OrganizationScopedQuery {
  readonly campaignId?: CampaignId;
}
export interface FindCalendarResult {
  readonly entries: readonly CalendarEntry[];
  readonly total: number;
}

export type SearchMarketingRecordType = 'campaign' | 'content';

export interface SearchMarketingQuery {
  readonly organizationId: OrganizationId;
  readonly keyword: string;
  readonly limit?: number;
}

export interface SearchMarketingMatch {
  readonly recordType: SearchMarketingRecordType;
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchMarketingResult {
  readonly matches: readonly SearchMarketingMatch[];
  readonly total: number;
}
