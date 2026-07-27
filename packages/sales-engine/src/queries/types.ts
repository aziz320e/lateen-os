/** @module queries/types */
import type { SalesActivity, SalesActivityType, SalesRelatedEntityType } from '../activity/types.js';
import type { ForecastSnapshot } from '../forecast/types.js';
import type { CustomerId, OrganizationId, SalesOpportunityId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { SalesOpportunity, SalesOpportunityStatus, SalesPipelineStage } from '../opportunity/types.js';
import type { Quote, QuoteStatus } from '../quote/types.js';
import type { SalesTask, SalesTaskStatus, SalesTaskType } from '../task/types.js';

export interface FindOpportunitiesQuery extends OrganizationScopedQuery {
  readonly stage?: SalesPipelineStage;
  readonly status?: SalesOpportunityStatus;
  readonly customerId?: CustomerId;
}
export interface FindOpportunitiesResult {
  readonly opportunities: readonly SalesOpportunity[];
  readonly total: number;
}

export interface FindQuotesQuery extends OrganizationScopedQuery {
  readonly status?: QuoteStatus;
  readonly opportunityId?: SalesOpportunityId;
}
export interface FindQuotesResult {
  readonly quotes: readonly Quote[];
  readonly total: number;
}

export type FindForecastsQuery = OrganizationScopedQuery;
export interface FindForecastsResult {
  readonly forecasts: readonly ForecastSnapshot[];
  readonly total: number;
}

export type FindPipelineQuery = OrganizationScopedQuery;
export interface FindPipelineResult {
  readonly groupedByStage: Readonly<Record<SalesPipelineStage, readonly SalesOpportunity[]>>;
  readonly total: number;
}

export interface FindActivitiesQuery extends OrganizationScopedQuery {
  readonly activityType?: SalesActivityType;
  readonly relatedEntityType?: SalesRelatedEntityType;
  readonly relatedEntityId?: string;
}
export interface FindActivitiesResult {
  readonly activities: readonly SalesActivity[];
  readonly total: number;
}

export interface FindTasksQuery extends OrganizationScopedQuery {
  readonly status?: SalesTaskStatus;
  readonly taskType?: SalesTaskType;
  readonly opportunityId?: SalesOpportunityId;
}
export interface FindTasksResult {
  readonly tasks: readonly SalesTask[];
  readonly total: number;
}

export type SearchSalesRecordType = 'opportunity' | 'quote';

export interface SearchSalesQuery {
  readonly organizationId: OrganizationId;
  readonly keyword: string;
  readonly limit?: number;
}

export interface SearchSalesMatch {
  readonly recordType: SearchSalesRecordType;
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchSalesResult {
  readonly matches: readonly SearchSalesMatch[];
  readonly total: number;
}
