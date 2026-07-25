/**
 * Real {@link Reasoner} implementation. Deliberately deterministic and
 * rule-based, never LLM-driven — this package's own architecture doc states
 * no AI agent may finalize a business decision directly, so its reasoning
 * must stay auditable and reproducible.
 *
 * @module reasoning/reasoner.impl
 */
import { randomUUID } from 'node:crypto';
import type { EvaluationCriteria, EvaluationResult, EvaluationScore } from '../evaluation/types.js';
import type { RiskLevel } from '../risk/types.js';
import type { Reasoner, ReasoningInput } from './reasoner.js';

const RISK_PENALTY: Record<RiskLevel, number> = {
  critical: 0.4,
  high: 0.25,
  medium: 0.1,
  low: 0.05,
  negligible: 0,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function averageRecommendationScore(recommendations: ReasoningInput['recommendations']): number {
  if (recommendations.length === 0) return 0;
  const total = recommendations.reduce((sum, recommendation) => sum + parseFloat(recommendation.score.value), 0);
  return total / recommendations.length;
}

function averageConfidence(recommendations: ReasoningInput['recommendations']): number {
  if (recommendations.length === 0) return 0.5;
  const total = recommendations.reduce(
    (sum, recommendation) => sum + parseFloat(recommendation.score.confidence),
    0,
  );
  return total / recommendations.length;
}

/** Creates a {@link Reasoner} that scores recommendations against risk, deterministically. */
export function createReasoner(): Reasoner {
  return {
    async reason(input: ReasoningInput): Promise<EvaluationResult> {
      const { decision, recommendations } = input;
      const strengthScore = averageRecommendationScore(recommendations);
      const riskPenalty = RISK_PENALTY[decision.risk];
      const overallScore = clamp01(strengthScore - riskPenalty);

      const criteria: EvaluationCriteria[] = [
        { code: 'recommendation_strength', name: 'Recommendation Strength' },
        { code: 'risk_adjustment', name: 'Risk Adjustment' },
      ];
      const scores: EvaluationScore[] = [
        { criteriaCode: 'recommendation_strength', score: strengthScore.toFixed(2) },
        { criteriaCode: 'risk_adjustment', score: (-riskPenalty).toFixed(2) },
      ];

      const now = new Date().toISOString();
      return {
        id: randomUUID(),
        organizationId: decision.organizationId,
        createdAt: now,
        updatedAt: now,
        decisionId: decision.id,
        criteria,
        scores,
        overallScore: overallScore.toFixed(2),
        confidence: averageConfidence(recommendations).toFixed(2),
        passed: overallScore >= 0.5,
        summary: `Evaluated ${recommendations.length} recommendation(s) against "${decision.risk}" risk level`,
      };
    },
  };
}
