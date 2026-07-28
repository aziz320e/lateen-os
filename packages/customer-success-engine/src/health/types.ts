/** @module health/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { HealthSnapshotId } from '../shared/identifiers.js';

export type { HealthSnapshotId };

export type HealthTier = 'healthy' | 'neutral' | 'at_risk' | 'critical';

/**
 * A deterministic customer health snapshot — every component is a
 * 0–100 caller-supplied score, and `overallScore`/`tier` are computed
 * fixed arithmetic, never a model prediction.
 */
export interface HealthSnapshot extends TenantAuditableEntity<HealthSnapshotId> {
  readonly customerId: string;
  readonly usageScore: number;
  readonly communicationScore: number;
  readonly projectScore: number;
  readonly paymentScore: number;
  readonly engagementScore: number;
  readonly renewalScore: number;
  readonly overallScore: number;
  readonly tier: HealthTier;
}
