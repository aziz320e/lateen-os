/** @module report/types */
import type { ComplianceFrameworkCode } from '../framework/types.js';
import type { GapAnalysisResult } from '../gap-analysis/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceFrameworkId, ComplianceReportId } from '../shared/identifiers.js';
import type { ComplianceStatus } from '../assessment/types.js';

export type { ComplianceReportId };

export interface RemediationProgress {
  readonly total: number;
  readonly completed: number;
  readonly percentComplete: number;
}

/** A single, deterministically-generated compliance report for one framework. */
export interface ComplianceReport extends TenantAuditableEntity<ComplianceReportId> {
  readonly frameworkId: ComplianceFrameworkId;
  readonly frameworkCode: ComplianceFrameworkCode;
  readonly status: ComplianceStatus;
  readonly score: number;
  readonly findings: readonly string[];
  readonly gaps: GapAnalysisResult;
  readonly remediationProgress: RemediationProgress;
  readonly generatedAt: string;
}
