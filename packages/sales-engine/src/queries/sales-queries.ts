/** @module queries/sales-queries */
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
  SearchSalesQuery,
  SearchSalesResult,
} from './types.js';

/** Real, read-only Sales Engine query port. */
export interface SalesQueries {
  findOpportunities(query: FindOpportunitiesQuery): Promise<FindOpportunitiesResult>;
  findQuotes(query: FindQuotesQuery): Promise<FindQuotesResult>;
  findForecasts(query: FindForecastsQuery): Promise<FindForecastsResult>;
  findPipeline(query: FindPipelineQuery): Promise<FindPipelineResult>;
  findActivities(query: FindActivitiesQuery): Promise<FindActivitiesResult>;
  findTasks(query: FindTasksQuery): Promise<FindTasksResult>;
  searchSales(query: SearchSalesQuery): Promise<SearchSalesResult>;
}
