import { describe, expect, it } from 'vitest';
import { createModelRegistry } from '../src/model/registry.impl.js';
import { MODEL_CATALOG } from '../src/model/catalog.js';

describe('createModelRegistry', () => {
  it('is pre-populated with the full model catalog by default', () => {
    const registry = createModelRegistry();
    expect(registry.list()).toHaveLength(MODEL_CATALOG.length);
  });

  it('lists models by provider', () => {
    const registry = createModelRegistry();
    const openAiModels = registry.listByProvider('openai');
    expect(openAiModels.length).toBeGreaterThan(0);
    for (const registration of openAiModels) {
      expect(registration.metadata.providerId).toBe('openai');
    }
  });

  it('finds models by capability', () => {
    const registry = createModelRegistry();
    const reasoningModels = registry.findByCapability('reasoning');
    expect(reasoningModels.length).toBeGreaterThan(0);
  });

  it('selects models matching capability + minimum context window', () => {
    const registry = createModelRegistry();
    const results = registry.select({ capability: 'chat-completion', minContextWindow: 150_000 });
    expect(results.length).toBeGreaterThan(0);
    for (const model of results) {
      expect(model.contextWindow).toBeGreaterThanOrEqual(150_000);
    }
  });

  it('selects only reasoning-capable models when requiresReasoning is set', () => {
    const registry = createModelRegistry();
    const results = registry.select({ capability: 'chat-completion', requiresReasoning: true });
    expect(results.length).toBeGreaterThan(0);
    for (const model of results) {
      expect(model.supportsReasoning).toBe(true);
    }
  });

  it('selects only models under a maximum cost per 1k tokens', () => {
    const registry = createModelRegistry();
    const results = registry.select({ capability: 'chat-completion', maxCostPer1kTokens: '0.001' });
    expect(results.length).toBeGreaterThan(0);
    for (const model of results) {
      const per1k = (parseFloat(model.pricing.promptTokenUsd) + parseFloat(model.pricing.completionTokenUsd)) * 1000;
      expect(per1k).toBeLessThanOrEqual(0.001);
    }
  });

  it('registers and unregisters a model', () => {
    const registry = createModelRegistry();
    registry.register({
      metadata: {
        id: 'custom-model',
        providerId: 'openai',
        providerKind: 'openai',
        displayName: 'Custom',
        modelCode: 'custom',
        contextWindow: 1000,
        maxOutputTokens: 250,
        capabilities: ['chat-completion'],
        tier: 'economy',
        quality: 'fast',
        supportsReasoning: false,
        pricing: { promptTokenUsd: '0', completionTokenUsd: '0' },
      },
      enabled: true,
    });
    expect(registry.get('custom-model')).toBeDefined();
    registry.unregister('custom-model');
    expect(registry.get('custom-model')).toBeUndefined();
  });
});
