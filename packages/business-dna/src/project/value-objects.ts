/**
 * Project value objects (Enrichment v1).
 * @module project/value-objects
 */
export type { ProjectSite, RolloutPhase } from './types.js';

/** Rollout progress snapshot for nationwide projects. */
export interface RolloutProgress {
  readonly rolloutProgressPct?: string;
  readonly sitesCompleted?: number;
  readonly sitesRemaining?: number;
  readonly currentPhase?: number;
}
