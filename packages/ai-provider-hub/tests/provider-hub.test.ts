import { describe, expect, it } from 'vitest';
import { PROVIDER_CATALOG, SUPPORTED_PROVIDER_KINDS } from '../src/provider/catalog.js';
import { MODEL_CATALOG, getModelsByProvider, getModelsByCapability } from '../src/model/catalog.js';
import { applyRoutingStrategy, selectCheapest } from '../src/routing/strategies.js';
import { calculateTokenCost } from '../src/cost/calculator.js';
import { chatCompletionRequestSchema, embeddingRequestSchema } from '../src/schemas.js';
import { providerPolicySchema } from '../src/policy/types.js';

describe('Provider Catalog', () => {
  it('includes all 10 supported providers', () => {
    expect(PROVIDER_CATALOG.length).toBe(10);
    expect(SUPPORTED_PROVIDER_KINDS).toEqual(
      expect.arrayContaining([
        'openai',
        'anthropic',
        'google',
        'azure-openai',
        'ollama',
        'deepseek',
        'mistral',
        'qwen',
        'llama-cpp',
        'openrouter',
      ]),
    );
  });

  it('each provider has chat-completion capability or embeddings', () => {
    for (const provider of PROVIDER_CATALOG) {
      const hasCore = provider.capabilities.includes('chat-completion') || provider.capabilities.includes('embeddings');
      expect(hasCore, `${provider.kind} missing core capability`).toBe(true);
    }
  });
});

describe('Model Catalog', () => {
  it('has models for each major provider', () => {
    for (const kind of ['openai', 'anthropic', 'google', 'deepseek', 'mistral']) {
      expect(getModelsByProvider(kind).length).toBeGreaterThan(0);
    }
  });

  it('finds embedding models', () => {
    const embeddings = getModelsByCapability('embeddings');
    expect(embeddings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Routing Strategies', () => {
  it('selects cheapest model for chat-completion', () => {
    const decision = selectCheapest({
      capability: 'chat-completion',
      policy: { strategy: 'cheapest' },
    });
    expect(decision).toBeDefined();
    expect(decision!.strategy).toBe('cheapest');
  });

  it('applies policy-based routing', () => {
    const decision = applyRoutingStrategy(
      { capability: 'chat-completion', policy: { strategy: 'policy-based' } },
      { providerLatencies: {}, providerCosts: {}, providerHealth: {} },
    );
    expect(decision).toBeDefined();
  });
});

describe('Cost Calculator', () => {
  it('calculates token cost from catalog pricing', () => {
    const breakdown = calculateTokenCost({
      providerId: 'openai',
      modelId: 'gpt-4o-mini',
      promptTokens: 1000,
      completionTokens: 500,
    });
    expect(parseFloat(breakdown.totalCost)).toBeGreaterThan(0);
    expect(breakdown.currency).toBe('USD');
  });

  it('includes cached token cost', () => {
    const breakdown = calculateTokenCost({
      providerId: 'openai',
      modelId: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      cachedTokens: 200,
    });
    expect(parseFloat(breakdown.cachedCost)).toBeGreaterThanOrEqual(0);
  });
});

describe('Zod Schemas', () => {
  it('validates chat completion request', () => {
    const result = chatCompletionRequestSchema.safeParse({
      modelId: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates embedding request', () => {
    const result = embeddingRequestSchema.safeParse({
      input: 'Hello world',
      modelId: 'text-embedding-3-large',
    });
    expect(result.success).toBe(true);
  });

  it('validates provider policy', () => {
    const result = providerPolicySchema.safeParse({
      maxCostUsd: '10.00',
      maxTokens: 100_000,
      piiProtection: true,
    });
    expect(result.success).toBe(true);
  });
});
