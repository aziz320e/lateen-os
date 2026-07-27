/**
 * Marketing Metrics — deterministic impressions, clicks, opens,
 * conversions, cost, CPL, CAC, and ROI.
 * @module metrics
 */
export * from './types.js';
export * from './repository.js';
export { createMarketingMetricsRepository } from './repository.impl.js';
export { createMarketingMetricsEngine, computeDerivedMetrics, type MarketingMetricsEngine } from './engine.impl.js';
