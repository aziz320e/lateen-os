/**
 * Real {@link ConflictResolver} implementation — detects recommendations
 * proposing different actions for the same decision, and resolves by
 * selecting the highest-scored candidate.
 *
 * @module reasoning/conflict-resolver.impl
 */
import type { Recommendation } from '../recommendation/types.js';
import type { ConflictResolution, ConflictResolver, DecisionConflict } from './conflict-resolver.js';

function groupByDecision(recommendations: readonly Recommendation[]): Map<string, Recommendation[]> {
  const groups = new Map<string, Recommendation[]>();
  for (const recommendation of recommendations) {
    const key = recommendation.decisionId;
    const group = groups.get(key) ?? [];
    group.push(recommendation);
    groups.set(key, group);
  }
  return groups;
}

/** Creates a {@link ConflictResolver} using highest-score-wins resolution. */
export function createConflictResolver(): ConflictResolver {
  return {
    async detectConflicts(recommendations) {
      const conflicts: DecisionConflict[] = [];
      for (const [decisionId, group] of groupByDecision(recommendations)) {
        if (group.length < 2) continue;
        const distinctActions = new Set(group.map((recommendation) => recommendation.proposedAction));
        if (distinctActions.size > 1) {
          conflicts.push({
            decisionId,
            code: 'CONFLICTING_RECOMMENDATIONS',
            description: `${group.length} recommendations propose ${distinctActions.size} different actions for the same decision`,
            recommendations: group,
          });
        }
      }
      return conflicts;
    },

    async resolve(conflict): Promise<ConflictResolution> {
      const candidates = conflict.recommendations ?? [];
      const winner = candidates.length
        ? [...candidates].sort((a, b) => parseFloat(b.score.value) - parseFloat(a.score.value))[0]
        : undefined;

      return {
        conflict,
        resolution: winner
          ? `Selected recommendation "${winner.title}" (highest score: ${winner.score.value})`
          : 'No recommendations available to resolve conflict',
        winningRecommendationId: winner?.id,
      };
    },
  };
}
