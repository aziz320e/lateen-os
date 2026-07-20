/** @module research/value-objects */
import type { ConfidenceScore } from '../confidence/types.js';

/** Research recommendation with optional priority. */
export interface ResearchRecommendation {
  readonly text: string;
  readonly priority?: 'high' | 'medium' | 'low';
}

/** Research confidence assessment bundle. */
export interface ResearchConfidence {
  readonly score: ConfidenceScore;
  readonly rationale?: string;
}
