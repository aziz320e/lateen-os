import { describe, expect, it } from 'vitest';
import { createProviderTelemetry } from '../src/telemetry/telemetry.impl.js';
import { createProviderRegistry } from '../src/provider/registry.impl.js';
import type { RequestTelemetry } from '../src/telemetry/types.js';

function makeTelemetry(overrides: Partial<RequestTelemetry> = {}): RequestTelemetry {
  return {
    correlationId: 'c1',
    providerId: 'openai',
    modelId: 'gpt-4o',
    capability: 'chat-completion',
    latencyMs: 100,
    tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    costUsd: '0.01',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('createProviderTelemetry', () => {
  it('returns zeroed metrics for a provider with no recorded requests', async () => {
    const telemetry = createProviderTelemetry();
    const usage = await telemetry.getProviderUsage('openai');
    expect(usage.requestCount).toBe(0);
    expect(usage.averageLatencyMs).toBe(0);
  });

  it('aggregates provider usage across multiple recorded requests', async () => {
    const telemetry = createProviderTelemetry();
    await telemetry.record(makeTelemetry({ latencyMs: 100 }));
    await telemetry.record(makeTelemetry({ latencyMs: 200 }));

    const usage = await telemetry.getProviderUsage('openai');
    expect(usage.requestCount).toBe(2);
    expect(usage.totalTokens).toBe(60);
    expect(usage.averageLatencyMs).toBe(150);
  });

  it('counts errors separately from total requests', async () => {
    const telemetry = createProviderTelemetry();
    await telemetry.record(makeTelemetry());
    await telemetry.record(makeTelemetry({ error: 'boom' }));

    const usage = await telemetry.getProviderUsage('openai');
    expect(usage.requestCount).toBe(2);
    expect(usage.errorCount).toBe(1);
  });

  it('aggregates per-model token usage', async () => {
    const telemetry = createProviderTelemetry();
    await telemetry.record(makeTelemetry({ tokenUsage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 } }));

    const usage = await telemetry.getModelUsage('gpt-4o');
    expect(usage.providerId).toBe('openai');
    expect(usage.tokenUsage.totalTokens).toBe(10);
  });

  it('toSpanAttributes resolves provider kind from an injected registry', () => {
    const registry = createProviderRegistry();
    const telemetry = createProviderTelemetry(registry);
    const attrs = telemetry.toSpanAttributes(makeTelemetry());
    expect(attrs['lateen.provider.id']).toBe('openai');
    expect(attrs['lateen.provider.kind']).toBe('openai');
    expect(attrs['lateen.tokens.prompt']).toBe(10);
    expect(attrs['lateen.cost.usd']).toBe('0.01');
  });

  it('toSpanAttributes falls back to the provider id when no registry is injected', () => {
    const telemetry = createProviderTelemetry();
    const attrs = telemetry.toSpanAttributes(makeTelemetry({ providerId: 'unregistered' }));
    expect(attrs['lateen.provider.kind']).toBe('unregistered');
  });
});
