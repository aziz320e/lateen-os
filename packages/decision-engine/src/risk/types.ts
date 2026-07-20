/** @module risk/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, RiskAssessmentId } from '../shared/identifiers.js';

export type { RiskAssessmentId };

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'negligible';

/** Individual factor contributing to overall risk. */
export interface RiskFactor {
  readonly code: string;
  readonly description: string;
  readonly level: RiskLevel;
  readonly weight?: string;
}

/** Risk assessment attached to a decision. */
export interface RiskAssessment extends TenantAuditableEntity<RiskAssessmentId> {
  readonly overallLevel: RiskLevel;
  readonly factors: readonly RiskFactor[];
  readonly summary?: string;
  readonly mitigationNotes?: string;
}

export type { OrganizationId };
