/** @module performance/repository */
import type { Repository } from '../shared/repository.js';
import type { PerformanceMetrics, PerformanceMetricsId } from './types.js';

export type PerformanceMetricsRepository = Repository<PerformanceMetrics, PerformanceMetricsId>;
