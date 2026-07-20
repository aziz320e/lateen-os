/** @module scoring/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { IntelligenceScoreId, OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { IntelligenceScoreId };

export type ScoringSubjectType =
  | 'product'
  | 'capability'
  | 'machine'
  | 'market'
  | 'opportunity'
  | 'recommendation';

export interface DemandScore {
  readonly value: ScoreValue;
}

export interface ScoringTrendScore {
  readonly value: ScoreValue;
  readonly direction?: 'rising' | 'stable' | 'declining';
}

export interface ProfitScore {
  readonly value: ScoreValue;
}

export interface ComplexityScore {
  readonly value: ScoreValue;
}

export interface RiskScore {
  readonly value: ScoreValue;
}

export interface ROIScore {
  readonly value: ScoreValue;
}

/** Composite intelligence score bundle for a subject. */
export interface IntelligenceScore extends TenantAuditableEntity<IntelligenceScoreId> {
  readonly subjectType: ScoringSubjectType;
  readonly subjectId: string;
  readonly demand?: DemandScore;
  readonly trend?: ScoringTrendScore;
  readonly profit?: ProfitScore;
  readonly complexity?: ComplexityScore;
  readonly risk?: RiskScore;
  readonly roi?: ROIScore;
  readonly composite: ScoreValue;
}

export type { OrganizationId };
