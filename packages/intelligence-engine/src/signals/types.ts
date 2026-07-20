/** @module signals/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, SignalId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { SignalId };

export type SignalType =
  | 'demand_spike'
  | 'demand_drop'
  | 'price_change'
  | 'competitor_move'
  | 'capacity_constraint'
  | 'quality_issue'
  | 'customer_churn_risk'
  | 'opportunity_detected'
  | 'anomaly';

export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'critical';

export type SignalStatus = 'active' | 'acknowledged' | 'resolved' | 'archived';

/** Intelligence signal detected from data or analysis. */
export interface Signal extends TenantAuditableEntity<SignalId> {
  readonly type: SignalType;
  readonly title: string;
  readonly description?: string;
  readonly strength: SignalStrength;
  readonly score: ScoreValue;
  readonly observedAt: Timestamp;
  readonly subjectType?: string;
  readonly subjectId?: string;
  readonly status: SignalStatus;
}

export type { OrganizationId };
