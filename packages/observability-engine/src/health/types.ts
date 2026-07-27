/** @module health/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { HealthCheckId } from '../shared/identifiers.js';

export type { HealthCheckId };

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** A single, immutable health check result for one component. */
export interface HealthCheck extends TenantAuditableEntity<HealthCheckId> {
  readonly component: string;
  readonly status: HealthStatus;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly checkedAt: string;
}
