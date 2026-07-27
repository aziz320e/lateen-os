/**
 * Performance Metrics — win rate, loss rate, average deal size, average
 * sales cycle, and pipeline value, computed deterministically.
 * @module metrics
 */
export * from './types.js';
export {
  createPerformanceMetricsEngine,
  computeWinRate,
  computeLossRate,
  computeAverageDealSize,
  computeAverageSalesCycleDays,
  computePipelineValue,
  type PerformanceMetricsEngine,
} from './engine.impl.js';
