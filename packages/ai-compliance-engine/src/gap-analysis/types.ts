/** @module gap-analysis/types */
import type { ComplianceControlType } from '../control/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceControlId, ComplianceFrameworkId, GapAnalysisId } from '../shared/identifiers.js';

export type { GapAnalysisId };

export type RemediationGapKind = 'missing_control' | 'expired_control' | 'missing_evidence' | 'orphaned_policy';

export type RemediationPriority = 'low' | 'medium' | 'high' | 'critical';

/** A single, deterministically-generated remediation suggestion — not yet a tracked {@link Remediation} entity. */
export interface RemediationPlanItem {
  readonly gapType: RemediationGapKind;
  readonly referenceId: string;
  readonly suggestedAction: string;
  readonly priority: RemediationPriority;
}

/** The result of one Gap Analysis run for one framework. */
export interface GapAnalysisResult extends TenantAuditableEntity<GapAnalysisId> {
  readonly frameworkId: ComplianceFrameworkId;
  readonly missingControlTypes: readonly ComplianceControlType[];
  readonly expiredControlIds: readonly ComplianceControlId[];
  readonly controlsMissingEvidenceIds: readonly ComplianceControlId[];
  readonly orphanedPolicyIds: readonly string[];
  readonly remediationPlan: readonly RemediationPlanItem[];
  readonly analyzedAt: string;
}
