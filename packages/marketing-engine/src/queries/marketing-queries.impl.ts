/**
 * Real {@link MarketingQueries} implementation — a CQRS read layer
 * composed over the Marketing Engine repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * @module queries/marketing-queries.impl
 */
import type { AudienceRepository } from '../audience/repository.js';
import type { CalendarRepository } from '../calendar/repository.js';
import type { CampaignRepository } from '../campaign/repository.js';
import type { ContentRepository } from '../content/repository.js';
import type { ContentType } from '../content/types.js';
import type { MarketingLeadRepository } from '../lead-generation/repository.js';
import { computeDerivedMetrics } from '../metrics/engine.impl.js';
import type { MarketingMetricsRepository } from '../metrics/repository.js';
import type { MarketingMetricsCounters } from '../metrics/types.js';
import type { MarketingQueries } from './marketing-queries.js';
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
  SearchMarketingMatch,
  SearchMarketingQuery,
  SearchMarketingResult,
} from './types.js';

export interface MarketingQueriesDeps {
  readonly campaignRepository: CampaignRepository;
  readonly audienceRepository: AudienceRepository;
  readonly contentRepository: ContentRepository;
  readonly leadRepository: MarketingLeadRepository;
  readonly metricsRepository: MarketingMetricsRepository;
  readonly calendarRepository: CalendarRepository;
}

const ASSET_CONTENT_TYPES: readonly ContentType[] = ['asset', 'landing_page', 'media_reference'];

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link MarketingQueries} read port over the given repositories. */
export function createMarketingQueries(deps: MarketingQueriesDeps): MarketingQueries {
  return {
    async findCampaigns(query: FindCampaignsQuery): Promise<FindCampaignsResult> {
      let campaigns = query.status
        ? await deps.campaignRepository.findByStatus(query.organizationId, query.status)
        : await deps.campaignRepository.findAll(query.organizationId);
      if (query.campaignType) campaigns = campaigns.filter((campaign) => campaign.campaignType === query.campaignType);
      return { campaigns: paginate(campaigns, query.offset, query.limit), total: campaigns.length };
    },

    async findAudiences(query: FindAudiencesQuery): Promise<FindAudiencesResult> {
      let audiences = query.status
        ? await deps.audienceRepository.findByStatus(query.organizationId, query.status)
        : await deps.audienceRepository.findAll(query.organizationId);
      if (query.audienceType) audiences = audiences.filter((audience) => audience.audienceType === query.audienceType);
      return { audiences: paginate(audiences, query.offset, query.limit), total: audiences.length };
    },

    async findAssets(query: FindAssetsQuery): Promise<FindAssetsResult> {
      let assets = (await deps.contentRepository.findAll(query.organizationId)).filter((item) =>
        ASSET_CONTENT_TYPES.includes(item.contentType),
      );
      if (query.campaignId) assets = assets.filter((item) => item.campaignId === query.campaignId);
      return { assets: paginate(assets, query.offset, query.limit), total: assets.length };
    },

    async findContent(query: FindContentQuery): Promise<FindContentResult> {
      let content = query.contentType
        ? await deps.contentRepository.findByType(query.organizationId, query.contentType)
        : await deps.contentRepository.findAll(query.organizationId);
      if (query.status) content = content.filter((item) => item.status === query.status);
      if (query.campaignId) content = content.filter((item) => item.campaignId === query.campaignId);
      return { content: paginate(content, query.offset, query.limit), total: content.length };
    },

    async findLeads(query: FindLeadsQuery): Promise<FindLeadsResult> {
      let leads = query.source
        ? await deps.leadRepository.findBySource(query.organizationId, query.source)
        : await deps.leadRepository.findAll(query.organizationId);
      if (query.status) leads = leads.filter((lead) => lead.status === query.status);
      if (query.campaignId) leads = leads.filter((lead) => lead.campaignId === query.campaignId);
      if (query.minScore !== undefined) leads = leads.filter((lead) => (lead.score ?? 0) >= query.minScore!);
      return { leads: paginate(leads, query.offset, query.limit), total: leads.length };
    },

    async findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult> {
      let counters: readonly MarketingMetricsCounters[];
      if (query.campaignId) {
        const single = await deps.metricsRepository.findByCampaign(query.organizationId, query.campaignId);
        counters = single ? [single] : [];
      } else {
        counters = await deps.metricsRepository.findAll(query.organizationId);
      }
      const metrics = counters.map((c) => ({ ...c, ...computeDerivedMetrics(c) }));
      return { metrics: paginate(metrics, query.offset, query.limit), total: metrics.length };
    },

    async findCalendar(query: FindCalendarQuery): Promise<FindCalendarResult> {
      let entries = query.campaignId
        ? await deps.calendarRepository.findByCampaign(query.organizationId, query.campaignId)
        : await deps.calendarRepository.findAll(query.organizationId);
      entries = [...entries].sort((a, b) => (a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0));
      return { entries: paginate(entries, query.offset, query.limit), total: entries.length };
    },

    async searchMarketing(query: SearchMarketingQuery): Promise<SearchMarketingResult> {
      const [campaigns, content] = await Promise.all([
        deps.campaignRepository.findAll(query.organizationId),
        deps.contentRepository.findAll(query.organizationId),
      ]);

      const matches: SearchMarketingMatch[] = [];
      for (const campaign of campaigns) {
        const score = scoreLabel(campaign.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'campaign', id: campaign.id, label: campaign.name, score });
      }
      for (const item of content) {
        const score = scoreLabel(item.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'content', id: item.id, label: item.title, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
