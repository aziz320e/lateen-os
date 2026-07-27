/**
 * Real {@link SalesQueries} implementation — a CQRS read layer composed
 * over the Sales Engine repositories. Repositories are taken as
 * constructor dependencies but never returned to callers.
 *
 * @module queries/sales-queries.impl
 */
import type { SalesActivityRepository } from '../activity/repository.js';
import type { ForecastSnapshotRepository } from '../forecast/repository.js';
import type { SalesOpportunityRepository } from '../opportunity/repository.js';
import type { SalesPipelineStage } from '../opportunity/types.js';
import type { QuoteRepository } from '../quote/repository.js';
import type { SalesTaskRepository } from '../task/repository.js';
import type { SalesQueries } from './sales-queries.js';
import type {
  FindActivitiesQuery,
  FindActivitiesResult,
  FindForecastsQuery,
  FindForecastsResult,
  FindOpportunitiesQuery,
  FindOpportunitiesResult,
  FindPipelineQuery,
  FindPipelineResult,
  FindQuotesQuery,
  FindQuotesResult,
  FindTasksQuery,
  FindTasksResult,
  SearchSalesMatch,
  SearchSalesQuery,
  SearchSalesResult,
} from './types.js';

export interface SalesQueriesDeps {
  readonly opportunityRepository: SalesOpportunityRepository;
  readonly quoteRepository: QuoteRepository;
  readonly forecastRepository: ForecastSnapshotRepository;
  readonly activityRepository: SalesActivityRepository;
  readonly taskRepository: SalesTaskRepository;
}

const PIPELINE_STAGES: readonly SalesPipelineStage[] = [
  'new',
  'discovery',
  'qualified',
  'proposal',
  'negotiation',
  'verbal_commit',
  'won',
  'lost',
];

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

/** Creates a real {@link SalesQueries} read port over the given repositories. */
export function createSalesQueries(deps: SalesQueriesDeps): SalesQueries {
  return {
    async findOpportunities(query: FindOpportunitiesQuery): Promise<FindOpportunitiesResult> {
      let opportunities = query.stage
        ? await deps.opportunityRepository.findByStage(query.organizationId, query.stage)
        : await deps.opportunityRepository.findAll(query.organizationId);
      if (query.status) opportunities = opportunities.filter((opportunity) => opportunity.status === query.status);
      if (query.customerId) opportunities = opportunities.filter((opportunity) => opportunity.customerId === query.customerId);
      return { opportunities: paginate(opportunities, query.offset, query.limit), total: opportunities.length };
    },

    async findQuotes(query: FindQuotesQuery): Promise<FindQuotesResult> {
      let quotes = query.status
        ? await deps.quoteRepository.findByStatus(query.organizationId, query.status)
        : await deps.quoteRepository.findAll(query.organizationId);
      if (query.opportunityId) quotes = quotes.filter((quote) => quote.opportunityId === query.opportunityId);
      return { quotes: paginate(quotes, query.offset, query.limit), total: quotes.length };
    },

    async findForecasts(query: FindForecastsQuery): Promise<FindForecastsResult> {
      const forecasts = await deps.forecastRepository.findAll(query.organizationId);
      return { forecasts: paginate(forecasts, query.offset, query.limit), total: forecasts.length };
    },

    async findPipeline(query: FindPipelineQuery): Promise<FindPipelineResult> {
      const opportunities = await deps.opportunityRepository.findAll(query.organizationId);
      const groupedByStage = PIPELINE_STAGES.reduce<Record<SalesPipelineStage, readonly typeof opportunities[number][]>>(
        (groups, stage) => {
          groups[stage] = opportunities.filter((opportunity) => opportunity.stage === stage);
          return groups;
        },
        {} as Record<SalesPipelineStage, readonly typeof opportunities[number][]>,
      );
      return { groupedByStage, total: opportunities.length };
    },

    async findActivities(query: FindActivitiesQuery): Promise<FindActivitiesResult> {
      let activities = query.activityType
        ? await deps.activityRepository.findByType(query.organizationId, query.activityType)
        : await deps.activityRepository.findAll(query.organizationId);
      if (query.relatedEntityType) activities = activities.filter((activity) => activity.relatedTo.entityType === query.relatedEntityType);
      if (query.relatedEntityId) activities = activities.filter((activity) => activity.relatedTo.entityId === query.relatedEntityId);
      const sorted = [...activities].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
      return { activities: paginate(sorted, query.offset, query.limit), total: sorted.length };
    },

    async findTasks(query: FindTasksQuery): Promise<FindTasksResult> {
      let tasks = query.status
        ? await deps.taskRepository.findByStatus(query.organizationId, query.status)
        : await deps.taskRepository.findAll(query.organizationId);
      if (query.taskType) tasks = tasks.filter((task) => task.taskType === query.taskType);
      if (query.opportunityId) tasks = tasks.filter((task) => task.opportunityId === query.opportunityId);
      return { tasks: paginate(tasks, query.offset, query.limit), total: tasks.length };
    },

    async searchSales(query: SearchSalesQuery): Promise<SearchSalesResult> {
      const [opportunities, quotes] = await Promise.all([
        deps.opportunityRepository.findAll(query.organizationId),
        deps.quoteRepository.findAll(query.organizationId),
      ]);

      const matches: SearchSalesMatch[] = [];
      for (const opportunity of opportunities) {
        const score = scoreLabel(opportunity.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'opportunity', id: opportunity.id, label: opportunity.name, score });
      }
      for (const quote of quotes) {
        const score = scoreLabel(quote.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'quote', id: quote.id, label: quote.title, score });
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
