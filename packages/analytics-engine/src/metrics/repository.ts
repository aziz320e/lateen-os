/** @module metrics/repository */
import type { Repository } from '../shared/repository.js';
import type { MetricSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { MetricSnapshot, MetricType } from './types.js';

export interface MetricSnapshotRepository extends Repository<MetricSnapshot, MetricSnapshotId> {
  findAll(organizationId: OrganizationId): Promise<readonly MetricSnapshot[]>;
  findByName(organizationId: OrganizationId, metricName: string): Promise<readonly MetricSnapshot[]>;
  findByType(organizationId: OrganizationId, metricType: MetricType): Promise<readonly MetricSnapshot[]>;
}
