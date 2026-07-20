/** @module cost/types */
import type { CostRecordId, ModelId, OrganizationId, ProviderId } from '../shared/identifiers.js';
import type { CostAmount, CurrencyCode, TokenCount } from '../shared/primitives.js';

export interface TokenCostInput {
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly promptTokens: TokenCount;
  readonly completionTokens: TokenCount;
  readonly cachedTokens?: TokenCount;
}

export interface CostBreakdown {
  readonly promptCost: CostAmount;
  readonly completionCost: CostAmount;
  readonly cachedCost: CostAmount;
  readonly totalCost: CostAmount;
  readonly currency: CurrencyCode;
}

export interface CostRecord {
  readonly id: CostRecordId;
  readonly organizationId: OrganizationId;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly breakdown: CostBreakdown;
  readonly timestamp: string;
}

export interface BudgetQuota {
  readonly organizationId: OrganizationId;
  readonly maxCostUsd: CostAmount;
  readonly maxTokens: TokenCount;
  readonly period: 'daily' | 'monthly';
  readonly currentCostUsd: CostAmount;
  readonly currentTokens: TokenCount;
  readonly exceeded: boolean;
}
