/** @module retention/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ComplianceRetentionRuleId } from '../shared/identifiers.js';

export type { ComplianceRetentionRuleId };

/** The four data categories this package retains and can expire on a deterministic schedule. */
export type RetentionDataCategory = 'audit_evidence' | 'compliance_report' | 'assessment_history' | 'policy_history';

/** One retention rule per data category. */
export interface ComplianceRetentionRule extends TenantAuditableEntity<ComplianceRetentionRuleId> {
  readonly dataCategory: RetentionDataCategory;
  readonly retentionDays: number;
}
