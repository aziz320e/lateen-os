/**
 * Real ranking implementation — sorts scored subjects by a
 * {@link RankingStrategy} and assigns positions. Deterministic.
 *
 * @module ranking/ranker.impl
 */
import { randomUUID } from 'node:crypto';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { RankedItem, RankingResult, RankingStrategy } from './types.js';

export interface RankableItem {
  readonly subjectId: string;
  readonly score: ScoreValue;
}

export interface Ranker {
  rank(
    organizationId: OrganizationId,
    strategy: RankingStrategy,
    subjectType: string,
    items: readonly RankableItem[],
  ): RankingResult;
}

/** Creates a {@link Ranker}. `risk_asc` sorts ascending (lowest risk score first); every other strategy sorts descending. */
export function createRanker(): Ranker {
  return {
    rank(organizationId, strategy, subjectType, items) {
      const ascending = strategy === 'risk_asc';
      const sorted = [...items].sort((a, b) => {
        const diff = parseFloat(a.score) - parseFloat(b.score);
        return ascending ? diff : -diff;
      });

      const rankedItems: RankedItem[] = sorted.map((item, index) => ({
        subjectType,
        subjectId: item.subjectId,
        rank: index + 1,
        score: item.score,
      }));

      const now = new Date().toISOString();
      return {
        id: randomUUID(),
        organizationId,
        createdAt: now,
        updatedAt: now,
        strategy,
        subjectType,
        items: rankedItems,
      };
    },
  };
}
