/** @module evaluation/types */
import type { ConfidenceScore } from '@lateen-os/institutional-memory';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DecisionId, EvaluationResultId, OrganizationId } from '../shared/identifiers.js';

export type { EvaluationResultId };

/** Criterion used to evaluate a decision option. */
export interface EvaluationCriteria {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly weight?: string;
}

/** Score for a single evaluation criterion. */
export interface EvaluationScore {
  readonly criteriaCode: string;
  readonly score: string;
  readonly maxScore?: string;
  readonly notes?: string;
}

/** Outcome of evaluating a decision against criteria and context. */
export interface EvaluationResult extends TenantAuditableEntity<EvaluationResultId> {
  readonly decisionId: DecisionId;
  readonly criteria: readonly EvaluationCriteria[];
  readonly scores: readonly EvaluationScore[];
  readonly overallScore: string;
  readonly confidence: ConfidenceScore;
  readonly passed: boolean;
  readonly summary?: string;
}

export type { OrganizationId };
