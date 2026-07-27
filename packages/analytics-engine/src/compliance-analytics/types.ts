/** @module compliance-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceAnalyticsId } from '../shared/identifiers.js';

export type { ComplianceAnalyticsId };

export interface RemediationProgressSummary {
  readonly total: number;
  readonly completed: number;
  readonly percentComplete: number;
}

/** A single, deterministic compliance analytics snapshot. */
export interface ComplianceAnalyticsSnapshot extends TenantAuditableEntity<ComplianceAnalyticsId> {
  readonly complianceScore: number;
  readonly passedControls: number;
  readonly failedControls: number;
  readonly remediationProgress: RemediationProgressSummary;
  readonly frameworkCoverage: number;
  readonly computedAt: string;
}
