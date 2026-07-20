import { describe, expect, it } from 'vitest';
import { provider, connectorManifest } from '../src/index.js';

describe('HubSpot Provider', () => {
  it('exports connector manifest', () => {
    expect(connectorManifest.provider).toBe('hubspot');
    expect(connectorManifest.id).toBe('hubspot-connector');
  });

  it('testConnection returns ok with credentials', async () => {
    const settings = Object.fromEntries(["clientId","clientSecret"].map((k) => [k, 'test-value']));
    const result = await provider.testConnection({ settings });
    expect(result.ok).toBe(true);
  });

  it('authenticate stores credentials ref', async () => {
    const settings = Object.fromEntries(["clientId","clientSecret"].map((k) => [k, 'test-value']));
    const result = await provider.authenticate({ settings });
    expect(result.ok).toBe(true);
    expect(result.credentialsRef).toBeDefined();
  });

  it('sync pull returns records', async () => {
    const settings = Object.fromEntries(["clientId","clientSecret"].map((k) => [k, 'test-value']));
    const result = await provider.sync.pull({ settings }, 'contacts');
    expect(result.count).toBeGreaterThan(0);
  });

  it('webhook register returns registration', async () => {
    const settings = Object.fromEntries(["clientId","clientSecret"].map((k) => [k, 'test-value']));
    const reg = await provider.webhook.register({ settings, webhookUrl: 'https://example.com/hook' }, ['connected']);
    expect(reg.webhookId).toBeDefined();
  });

  it('health check reports status', async () => {
    const settings = Object.fromEntries(["clientId","clientSecret"].map((k) => [k, 'test-value']));
    const health = await provider.health.check({ settings });
    expect(['healthy', 'degraded', 'down']).toContain(health.status);
  });
});
