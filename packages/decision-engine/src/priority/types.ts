/** @module priority/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, PriorityScoreId } from '../shared/identifiers.js';

export type { PriorityScoreId };

export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low' | 'deferred';

export type PriorityStrategy =
  | 'fifo'
  | 'impact_first'
  | 'risk_first'
  | 'customer_priority'
  | 'revenue_weighted'
  | 'custom';

/** Numeric priority score as decimal string. */
export type PriorityScoreValue = string;

/** Computed priority for a decision or recommendation. */
export interface PriorityScore extends TenantAuditableEntity<PriorityScoreId> {
  readonly level: PriorityLevel;
  readonly score: PriorityScoreValue;
  readonly strategy: PriorityStrategy;
  readonly rationale?: string;
}

export type { OrganizationId };
