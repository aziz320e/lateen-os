/** @module security-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { SecurityAnalyticsId } from '../shared/identifiers.js';

export type { SecurityAnalyticsId };

/** A single, deterministic security analytics snapshot. */
export interface SecurityAnalyticsSnapshot extends TenantAuditableEntity<SecurityAnalyticsId> {
  readonly authenticationFailures: number;
  readonly authorizationFailures: number;
  readonly threatDetections: number;
  readonly blockedTools: number;
  readonly blockedProviders: number;
  readonly policyViolations: number;
  readonly computedAt: string;
}
