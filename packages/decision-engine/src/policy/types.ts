/** @module policy/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DecisionPolicyId, OrganizationId, PolicyViolationId } from '../shared/identifiers.js';

export type { DecisionPolicyId };

export type DecisionPolicyStatus = 'draft' | 'active' | 'suspended' | 'archived';

/** Scope where a decision policy applies. */
export interface PolicyScope {
  readonly entityTypes?: readonly string[];
  readonly categories?: readonly string[];
  readonly departments?: readonly string[];
  readonly organizationWide: boolean;
}

/** Constraint enforced by a decision policy. */
export interface PolicyConstraint {
  readonly code: string;
  readonly description: string;
  readonly expression?: string;
  readonly mandatory: boolean;
}

/** Policy governing how decisions are evaluated and approved. */
export interface DecisionPolicy extends TenantAuditableEntity<DecisionPolicyId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly scope: PolicyScope;
  readonly constraints: readonly PolicyConstraint[];
  readonly status: DecisionPolicyStatus;
}

/** Record of a policy constraint violation on a decision. */
export interface PolicyViolation {
  readonly violationId: PolicyViolationId;
  readonly policyId: DecisionPolicyId;
  readonly constraintCode: string;
  readonly message: string;
}

export type { OrganizationId };
