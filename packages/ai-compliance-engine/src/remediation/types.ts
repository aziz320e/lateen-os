/** @module remediation/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceFrameworkId, RemediationId } from '../shared/identifiers.js';

export type { RemediationId };

export type RemediationStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

/** What kind of compliance gap a remediation was raised for — set when generated from Gap Analysis. */
export type RemediationGapType = 'missing_control' | 'expired_control' | 'missing_evidence' | 'orphaned_policy' | 'audit_finding' | 'manual';

/** A single remediation item tracking a compliance gap or audit finding to closure. */
export interface Remediation extends TenantAuditableEntity<RemediationId> {
  readonly title: string;
  readonly description?: string;
  readonly gapType: RemediationGapType;
  /** The framework this remediation was raised for — drives per-framework remediation progress in Compliance Reports. */
  readonly frameworkId?: ComplianceFrameworkId;
  readonly referenceId?: string;
  readonly ownerId?: string;
  readonly dueDate?: string;
  readonly status: RemediationStatus;
  readonly completedAt?: string;
}
