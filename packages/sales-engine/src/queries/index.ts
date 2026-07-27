/**
 * Query Layer — findOpportunities, findQuotes, findForecasts,
 * findPipeline, findActivities, findTasks, searchSales.
 * @module queries
 */
export * from './types.js';
export * from './sales-queries.js';
export { createSalesQueries, type SalesQueriesDeps } from './sales-queries.impl.js';
