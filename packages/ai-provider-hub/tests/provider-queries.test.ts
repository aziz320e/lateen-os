import { describe, expect, it } from 'vitest';
import { createProviderQueries } from '../src/queries/provider-queries.impl.js';
import { createProviderRegistry } from '../src/provider/registry.impl.js';
import { createModelRegistry } from '../src/model/registry.impl.js';
import { createProviderSelector } from '../src/routing/selector.impl.js';
import { createProviderHealth } from '../src/provider/health.impl.js';
import { defaultCostCalculator } from '../src/cost/calculator.js';

function buildQueries() {
  const providerRegistry = createProviderRegistry();
  const modelRegistry = createModelRegistry();
  const selector = createProviderSelector();
  const health = createProviderHealth(providerRegistry, { check: async () => ({ status: 'active' }) });
  return createProviderQueries({
    providerRegistry,
    modelRegistry,
    costCalculator: defaultCostCalculator,
    selector,
    health,
  });
}

describe('createProviderQueries', () => {
  it('listProviders returns every active provider by default', async () => {
    const queries = buildQueries();
    const result = await queries.listProviders({});
    expect(result.providers.length).toBeGreaterThan(0);
    expect(result.providers.some((p) => p.id === 'openai')).toBe(true);
  });

  it('listProviders filters by capability', async () => {
    const queries = buildQueries();
    const result = await queries.listProviders({ capability: 'embeddings' });
    expect(result.providers.length).toBeGreaterThan(0);
  });

  it('listModels filters by provider id', async () => {
    const queries = buildQueries();
    const result = await queries.listModels({ providerId: 'anthropic' });
    expect(result.models.length).toBeGreaterThan(0);
    for (const model of result.models) {
      expect(model.providerId).toBe('anthropic');
    }
  });

  it('estimateCost returns a real, non-zero breakdown for a known model', async () => {
    const queries = buildQueries();
    const result = await queries.estimateCost({ modelId: 'gpt-4o-mini', promptTokens: 1000, completionTokens: 500 });
    expect(parseFloat(result.breakdown.totalCost)).toBeGreaterThan(0);
  });

  it('estimateCost returns zero for an unknown model rather than throwing', async () => {
    const queries = buildQueries();
    const result = await queries.estimateCost({ modelId: 'nonexistent', promptTokens: 100, completionTokens: 100 });
    expect(result.breakdown.totalCost).toBe('0');
  });

  it('selectProvider delegates to the wired selector', async () => {
    const queries = buildQueries();
    const result = await queries.selectProvider({ capability: 'chat-completion', strategy: 'cheapest' });
    expect(result.decision.providerId).toBeTruthy();
  });

  it('getHealth for a specific provider returns exactly one snapshot', async () => {
    const queries = buildQueries();
    const result = await queries.getHealth({ providerId: 'openai' });
    expect(result.health).toHaveLength(1);
    expect(result.health[0]!.providerId).toBe('openai');
  });

  it('getHealth with no providerId checks every registered provider', async () => {
    const queries = buildQueries();
    const result = await queries.getHealth({});
    expect(result.health.length).toBeGreaterThan(1);
  });
});
