/** @module recommendation/value-objects */
import type { Alternative, RecommendationScore } from './types.js';

/** Ranked list of alternatives for a recommendation. */
export interface RankedAlternatives {
  readonly alternatives: readonly Alternative[];
  readonly selectedCode?: string;
}
