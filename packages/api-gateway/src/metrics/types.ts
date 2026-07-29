/** @module metrics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { HealthSnapshotId, RequestMetricId } from '../shared/identifiers.js';
import type { HttpMethod, ISODateTime } from '../shared/primitives.js';

export type { HealthSnapshotId, RequestMetricId };

/** One immutable request outcome record. */
export interface RequestMetric extends TenantAuditableEntity<RequestMetricId> {
  readonly correlationId: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
}

/** One point-in-time health check result for a registered backend service. */
export interface HealthSnapshot extends TenantAuditableEntity<HealthSnapshotId> {
  readonly serviceName: string;
  readonly healthy: boolean;
  readonly checkedAt: ISODateTime;
}
