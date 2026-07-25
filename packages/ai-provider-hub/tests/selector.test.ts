import { describe, expect, it } from 'vitest';
import { createProviderSelector } from '../src/routing/selector.impl.js';

describe('createProviderSelector', () => {
  it('selects a decision for a satisfiable request', async () => {
    const selector = createProviderSelector();
    const decision = await selector.select(
      { capability: 'chat-completion', policy: { strategy: 'cheapest' } },
      { providerLatencies: {}, providerCosts: {}, providerHealth: {} },
    );
    expect(decision.strategy).toBe('cheapest');
    expect(decision.providerId).toBeTruthy();
    expect(decision.modelId).toBeTruthy();
  });

  it('rejects when no model can satisfy the request', async () => {
    const selector = createProviderSelector();
    await expect(
      selector.select(
        { capability: 'text-to-speech', policy: { strategy: 'cheapest', allowedProviderIds: ['nonexistent'] } },
        { providerLatencies: {}, providerCosts: {}, providerHealth: {} },
      ),
    ).rejects.toThrow(/No provider\/model available/);
  });

  it('explain produces a human-readable string referencing the decision', async () => {
    const selector = createProviderSelector();
    const decision = await selector.select(
      { capability: 'chat-completion', policy: { strategy: 'cheapest' } },
      { providerLatencies: {}, providerCosts: {}, providerHealth: {} },
    );
    const explanation = selector.explain(decision);
    expect(explanation).toContain(decision.providerId);
    expect(explanation).toContain(decision.modelId);
  });
});
