/** @module governance-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { GovernanceAnalyticsId } from '../shared/identifiers.js';

export type { GovernanceAnalyticsId };

/** A single, deterministic governance analytics snapshot. */
export interface GovernanceAnalyticsSnapshot extends TenantAuditableEntity<GovernanceAnalyticsId> {
  readonly activePolicies: number;
  readonly pendingApprovals: number;
  readonly governanceViolations: number;
  readonly riskDistribution: Readonly<Record<string, number>>;
  readonly computedAt: string;
}
