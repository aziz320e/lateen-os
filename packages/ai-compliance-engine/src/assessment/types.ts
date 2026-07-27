/** @module assessment/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceAssessmentId, ComplianceControlId, ComplianceFrameworkId } from '../shared/identifiers.js';

export type { ComplianceAssessmentId };

export type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';

/** Per-control classification outcome computed during an assessment run. */
export type ControlEvaluationOutcome = 'passed' | 'failed' | 'pending';

/** A single, deterministic compliance assessment run for one framework. */
export interface ComplianceAssessment extends TenantAuditableEntity<ComplianceAssessmentId> {
  readonly frameworkId: ComplianceFrameworkId;
  readonly status: ComplianceStatus;
  readonly score: number;
  readonly passedControlIds: readonly ComplianceControlId[];
  readonly failedControlIds: readonly ComplianceControlId[];
  readonly pendingControlIds: readonly ComplianceControlId[];
  readonly assessedAt: string;
}
