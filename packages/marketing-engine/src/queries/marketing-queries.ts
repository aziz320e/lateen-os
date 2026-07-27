/** @module queries/marketing-queries */
import type {
  FindAssetsQuery,
  FindAssetsResult,
  FindAudiencesQuery,
  FindAudiencesResult,
  FindCalendarQuery,
  FindCalendarResult,
  FindCampaignsQuery,
  FindCampaignsResult,
  FindContentQuery,
  FindContentResult,
  FindLeadsQuery,
  FindLeadsResult,
  FindMetricsQuery,
  FindMetricsResult,
  SearchMarketingQuery,
  SearchMarketingResult,
} from './types.js';

/** Real, read-only Marketing Engine query port. */
export interface MarketingQueries {
  findCampaigns(query: FindCampaignsQuery): Promise<FindCampaignsResult>;
  findAudiences(query: FindAudiencesQuery): Promise<FindAudiencesResult>;
  findAssets(query: FindAssetsQuery): Promise<FindAssetsResult>;
  findContent(query: FindContentQuery): Promise<FindContentResult>;
  findLeads(query: FindLeadsQuery): Promise<FindLeadsResult>;
  findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult>;
  findCalendar(query: FindCalendarQuery): Promise<FindCalendarResult>;
  searchMarketing(query: SearchMarketingQuery): Promise<SearchMarketingResult>;
}
