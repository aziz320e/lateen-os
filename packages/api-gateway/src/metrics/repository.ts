/** @module metrics/repository */
import type { Repository } from '../shared/repository.js';
import type { HealthSnapshotId, OrganizationId, RequestMetricId } from '../shared/identifiers.js';
import type { HealthSnapshot, RequestMetric } from './types.js';

export interface RequestMetricRepository extends Repository<RequestMetric, RequestMetricId> {
  findAll(organizationId: OrganizationId): Promise<readonly RequestMetric[]>;
  findByPath(organizationId: OrganizationId, path: string): Promise<readonly RequestMetric[]>;
}

export interface HealthSnapshotRepository extends Repository<HealthSnapshot, HealthSnapshotId> {
  findAll(organizationId: OrganizationId): Promise<readonly HealthSnapshot[]>;
  findByService(organizationId: OrganizationId, serviceName: string): Promise<readonly HealthSnapshot[]>;
}
