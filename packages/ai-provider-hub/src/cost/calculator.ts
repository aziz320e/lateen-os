/** @module cost/calculator */
import { MODEL_CATALOG } from '../model/catalog.js';
import type { CostBreakdown, TokenCostInput } from './types.js';

/** Pure cost calculation (contracts — no provider SDK). */
export function calculateTokenCost(input: TokenCostInput): CostBreakdown {
  const model = MODEL_CATALOG.find((m) => m.id === input.modelId && m.providerId === input.providerId);
  if (!model) {
    return {
      promptCost: '0',
      completionCost: '0',
      cachedCost: '0',
      totalCost: '0',
      currency: 'USD',
    };
  }

  const promptCost = input.promptTokens * parseFloat(model.pricing.promptTokenUsd);
  const completionCost = input.completionTokens * parseFloat(model.pricing.completionTokenUsd);
  const cachedRate = model.pricing.cachedTokenUsd ?? model.pricing.promptTokenUsd;
  const cachedCost = (input.cachedTokens ?? 0) * parseFloat(cachedRate);
  const total = promptCost + completionCost + cachedCost;

  return {
    promptCost: promptCost.toFixed(8),
    completionCost: completionCost.toFixed(8),
    cachedCost: cachedCost.toFixed(8),
    totalCost: total.toFixed(8),
    currency: 'USD',
  };
}

/** Cost calculation port. */
export interface CostCalculator {
  calculate(input: TokenCostInput): CostBreakdown;
  estimate(modelId: string, estimatedTokens: number): CostBreakdown;
  checkBudget(organizationId: string, additionalCost: string): Promise<boolean>;
}

export const defaultCostCalculator: CostCalculator = {
  calculate: calculateTokenCost,
  estimate(modelId, estimatedTokens) {
    const model = MODEL_CATALOG.find((m) => m.id === modelId);
    if (!model) {
      return { promptCost: '0', completionCost: '0', cachedCost: '0', totalCost: '0', currency: 'USD' };
    }
    const half = estimatedTokens / 2;
    return calculateTokenCost({
      providerId: model.providerId,
      modelId: model.id,
      promptTokens: half,
      completionTokens: half,
    });
  },
  async checkBudget() {
    return true;
  },
};
