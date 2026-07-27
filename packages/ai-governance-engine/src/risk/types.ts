/** @module risk/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { RiskId } from '../shared/identifiers.js';

export type { RiskId };

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'open' | 'mitigating' | 'accepted' | 'escalated' | 'closed';

/** A single risk register entry. */
export interface Risk extends TenantAuditableEntity<RiskId> {
  readonly title: string;
  readonly description?: string;
  readonly category: string;
  readonly riskLevel: RiskLevel;
  readonly status: RiskStatus;
  readonly mitigationPlan?: string;
  readonly owner?: string;
  readonly acceptedBy?: string;
  readonly acceptedAt?: string;
}
