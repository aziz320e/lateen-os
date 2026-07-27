/** @module performance/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkerId } from '../shared/identifiers.js';
import type { PerformanceMetrics, PerformanceMetricsId } from './types.js';

export interface PerformanceMetricsRepository extends Repository<PerformanceMetrics, PerformanceMetricsId> {
  findByWorker(organizationId: OrganizationId, workerId: WorkerId): Promise<readonly PerformanceMetrics[]>;
}
