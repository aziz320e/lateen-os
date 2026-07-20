/** @module domain/profit-estimate */
import type {
  CapabilityMatchId,
  OrganizationId,
  ProfitEstimateId,
  RankedOpportunityId,
} from './identifiers.js';
import type { CurrencyCode, ScoreValue } from './primitives.js';

export type ProfitConfidence = 'high' | 'medium' | 'low';

/** Estimated profit potential for a manufacturable opportunity. */
export interface ProfitEstimate {
  readonly estimateId: ProfitEstimateId;
  readonly organizationId: OrganizationId;
  readonly opportunityId: RankedOpportunityId;
  readonly capabilityMatchId: CapabilityMatchId;
  readonly currency: CurrencyCode;
  readonly estimatedUnitCost: ScoreValue;
  readonly estimatedUnitPrice: ScoreValue;
  readonly estimatedMarginPercent: ScoreValue;
  readonly estimatedMonthlyVolume: ScoreValue;
  readonly projectedMonthlyProfit: ScoreValue;
  readonly confidence: ProfitConfidence;
}

export interface ProfitEstimationResult {
  readonly estimates: readonly ProfitEstimate[];
}
