/**
 * Lead Scoring — deterministic scoring across engagement, source,
 * profile completeness, activity count, and recency. No AI model.
 * @module lead-scoring
 */
export * from './types.js';
export {
  createLeadScoringEngine,
  computeLeadScore,
  computeRecencyScore,
  SOURCE_SCORE_WEIGHT,
  type LeadScoringEngine,
} from './engine.impl.js';
