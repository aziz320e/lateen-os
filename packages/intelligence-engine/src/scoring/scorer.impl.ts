/**
 * Real weighted composite scoring — combines demand/trend/profit/
 * complexity/risk/roi sub-scores into a single {@link IntelligenceScore}.
 * Complexity and risk are inverted (lower is better) before weighting.
 * Deterministic, pure math — no model calls, matching this package's
 * "produces intelligence only" boundary.
 *
 * @module scoring/scorer.impl
 */
import { randomUUID } from 'node:crypto';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type {
  ComplexityScore,
  DemandScore,
  IntelligenceScore,
  ProfitScore,
  ROIScore,
  RiskScore,
  ScoringSubjectType,
  ScoringTrendScore,
} from './types.js';

export interface ScoringWeights {
  readonly demand?: number;
  readonly trend?: number;
  readonly profit?: number;
  readonly complexity?: number;
  readonly risk?: number;
  readonly roi?: number;
}

const DEFAULT_WEIGHTS: Required<ScoringWeights> = {
  demand: 0.25,
  trend: 0.15,
  profit: 0.25,
  complexity: 0.1,
  risk: 0.15,
  roi: 0.1,
};

export interface ScoringInput {
  readonly demand?: DemandScore;
  readonly trend?: ScoringTrendScore;
  readonly profit?: ProfitScore;
  readonly complexity?: ComplexityScore;
  readonly risk?: RiskScore;
  readonly roi?: ROIScore;
}

/** Computes a weighted composite score from whichever sub-scores are present. */
export function computeCompositeScore(input: ScoringInput, weights: ScoringWeights = {}): ScoreValue {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  let total = 0;
  let weightSum = 0;

  if (input.demand) {
    total += parseFloat(input.demand.value) * w.demand;
    weightSum += w.demand;
  }
  if (input.trend) {
    total += parseFloat(input.trend.value) * w.trend;
    weightSum += w.trend;
  }
  if (input.profit) {
    total += parseFloat(input.profit.value) * w.profit;
    weightSum += w.profit;
  }
  if (input.complexity) {
    total += (1 - parseFloat(input.complexity.value)) * w.complexity;
    weightSum += w.complexity;
  }
  if (input.risk) {
    total += (1 - parseFloat(input.risk.value)) * w.risk;
    weightSum += w.risk;
  }
  if (input.roi) {
    total += parseFloat(input.roi.value) * w.roi;
    weightSum += w.roi;
  }

  return (weightSum > 0 ? total / weightSum : 0).toFixed(4);
}

export interface Scorer {
  score(
    organizationId: OrganizationId,
    subjectType: ScoringSubjectType,
    subjectId: string,
    input: ScoringInput,
    weights?: ScoringWeights,
  ): IntelligenceScore;
}

/** Creates a {@link Scorer} that builds a real, weighted {@link IntelligenceScore}. */
export function createScorer(): Scorer {
  return {
    score(organizationId, subjectType, subjectId, input, weights) {
      const now = new Date().toISOString();
      return {
        id: randomUUID(),
        organizationId,
        createdAt: now,
        updatedAt: now,
        subjectType,
        subjectId,
        ...input,
        composite: computeCompositeScore(input, weights),
      };
    },
  };
}
