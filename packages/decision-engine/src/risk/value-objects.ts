/** @module risk/value-objects */
import type { RiskLevel } from './types.js';

/** Weighted risk factor summary. */
export interface WeightedRiskFactor {
  readonly level: RiskLevel;
  readonly weight: string;
}
