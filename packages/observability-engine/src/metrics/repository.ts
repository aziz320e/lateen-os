/** @module metrics/repository */
import type { Repository } from '../shared/repository.js';
import type { MetricSampleId, OrganizationId } from '../shared/identifiers.js';
import type { MetricSample, MetricType } from './types.js';

export interface MetricSampleRepository extends Repository<MetricSample, MetricSampleId> {
  findAll(organizationId: OrganizationId): Promise<readonly MetricSample[]>;
  findByName(organizationId: OrganizationId, metricName: string): Promise<readonly MetricSample[]>;
  findByType(organizationId: OrganizationId, metricType: MetricType): Promise<readonly MetricSample[]>;
}
