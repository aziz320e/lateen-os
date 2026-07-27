/** @module policy/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { GovernancePolicyId, PolicyVersionId } from '../shared/identifiers.js';

export type { GovernancePolicyId, PolicyVersionId };

/** The seven governance policy domains supported by the engine. */
export type GovernancePolicyType = 'security' | 'workflow' | 'ai' | 'communication' | 'business' | 'approval' | 'runtime';

export type GovernancePolicyStatus = 'draft' | 'active' | 'inactive' | 'archived';

/** A single governance policy — its current, mutable state. */
export interface GovernancePolicy extends TenantAuditableEntity<GovernancePolicyId> {
  readonly policyType: GovernancePolicyType;
  readonly name: string;
  readonly description?: string;
  readonly rules?: Readonly<Record<string, unknown>>;
  readonly status: GovernancePolicyStatus;
  /** Stamped on `archive()`; consumed by `restore()` to return to the correct prior status. */
  readonly statusBeforeArchive?: GovernancePolicyStatus;
  readonly currentVersion: number;
}

/** An immutable snapshot of a {@link GovernancePolicy} at one point in its history. */
export interface GovernancePolicyVersion extends TenantAuditableEntity<PolicyVersionId> {
  readonly policyId: GovernancePolicyId;
  readonly version: number;
  readonly name: string;
  readonly description?: string;
  readonly rules?: Readonly<Record<string, unknown>>;
  readonly status: GovernancePolicyStatus;
}
