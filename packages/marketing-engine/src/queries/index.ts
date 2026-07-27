/**
 * Query Layer — findCampaigns, findAudiences, findAssets, findContent,
 * findLeads, findMetrics, findCalendar, searchMarketing.
 * @module queries
 */
export * from './types.js';
export * from './marketing-queries.js';
export { createMarketingQueries, type MarketingQueriesDeps } from './marketing-queries.impl.js';
