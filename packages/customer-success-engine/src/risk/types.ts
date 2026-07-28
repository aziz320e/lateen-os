/** @module risk/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CustomerRiskId } from '../shared/identifiers.js';

export type { CustomerRiskId };

export type CustomerRiskStatus = 'identified' | 'mitigating' | 'resolved' | 'accepted' | 'occurred';

export type CustomerRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * A single customer risk-register entry. `probability` and `impact`
 * are each a 1–5 ordinal rating; `score` is their deterministic
 * product (max 25) — never a model-based prediction.
 */
export interface CustomerRisk extends TenantAuditableEntity<CustomerRiskId> {
  readonly customerId: string;
  readonly title: string;
  readonly description?: string;
  readonly probability: number;
  readonly impact: number;
  readonly score: number;
  readonly mitigation?: string;
  readonly status: CustomerRiskStatus;
}
