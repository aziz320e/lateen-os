/** @module audit-engine/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AuditFindingId, ComplianceAuditId, ComplianceFrameworkId, RemediationId } from '../shared/identifiers.js';

export type { ComplianceAuditId, AuditFindingId };

export type ComplianceAuditStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type AuditFindingSeverity = 'observation' | 'minor' | 'major' | 'critical';

/** A single finding recorded during audit execution — observations, recommendations, and (optionally) a linked corrective action. */
export interface AuditFinding {
  readonly id: AuditFindingId;
  readonly severity: AuditFindingSeverity;
  readonly description: string;
  readonly recommendation?: string;
  /** References a {@link Remediation} tracked by this package's own Remediation Engine. */
  readonly correctiveActionId?: RemediationId;
  readonly recordedAt: string;
}

/** A single compliance audit — its plan, execution state, and findings. */
export interface ComplianceAudit extends TenantAuditableEntity<ComplianceAuditId> {
  readonly frameworkId?: ComplianceFrameworkId;
  readonly title: string;
  readonly scope?: string;
  readonly status: ComplianceAuditStatus;
  readonly plannedStartDate?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly findings: readonly AuditFinding[];
}
