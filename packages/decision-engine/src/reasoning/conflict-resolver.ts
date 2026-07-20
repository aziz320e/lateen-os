/**
 * Conflict resolver port — resolves conflicting recommendations or rules.
 *
 * @module reasoning/conflict-resolver
 */

import type { DecisionId } from '../shared/identifiers.js';
import type { Recommendation } from '../recommendation/types.js';
import type { DecisionRule } from '../rule/types.js';

/** Detected conflict between recommendations or rules. */
export interface DecisionConflict {
  readonly decisionId: DecisionId;
  readonly code: string;
  readonly description: string;
  readonly recommendations?: readonly Recommendation[];
  readonly rules?: readonly DecisionRule[];
}

/** Resolution of a decision conflict. */
export interface ConflictResolution {
  readonly conflict: DecisionConflict;
  readonly resolution: string;
  readonly winningRecommendationId?: string;
}

/** Port for resolving conflicts during decision processing. */
export interface ConflictResolver {
  detectConflicts(recommendations: readonly Recommendation[]): Promise<readonly DecisionConflict[]>;

  resolve(conflict: DecisionConflict): Promise<ConflictResolution>;
}
