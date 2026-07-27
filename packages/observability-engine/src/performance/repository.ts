/** @module performance/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PerformanceSampleId } from '../shared/identifiers.js';
import type { PerformanceMetric, PerformanceSample } from './types.js';

export interface PerformanceSampleRepository extends Repository<PerformanceSample, PerformanceSampleId> {
  findAll(organizationId: OrganizationId): Promise<readonly PerformanceSample[]>;
  findByMetric(organizationId: OrganizationId, metric: PerformanceMetric): Promise<readonly PerformanceSample[]>;
}
