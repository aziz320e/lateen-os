/** @module lead-scoring/types */
import type { LeadSource } from '../lead-generation/types.js';

/** Deterministic scoring input — every factor is optional and defaults to its least-favorable value. */
export interface LeadScoringInput {
  readonly engagementScore?: number;
  readonly source: LeadSource;
  readonly profileCompletenessPct?: number;
  readonly activityCount?: number;
  readonly daysSinceLastActivity?: number;
}
