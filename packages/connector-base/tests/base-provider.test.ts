import { describe, expect, it } from 'vitest';
import { createConnectorProvider, PROVIDER_DEFINITIONS, toProviderConfig } from '../src/index.js';
import { defineConnector } from '@lateen-os/sdk';

describe('Connector Base', () => {
  it('creates provider with all adapters', () => {
    const def = PROVIDER_DEFINITIONS[0]!;
    const manifest = defineConnector({
      id: `${def.folder}-connector`,
      name: `${def.folder}-connector`,
      provider: def.definitionCode,
      version: '1.0.0',
      auth: def.auth,
    });
    const config = toProviderConfig(def, manifest);
    const provider = createConnectorProvider(config);

    expect(provider.definitionCode).toBe(def.definitionCode);
    expect(provider.sync).toBeDefined();
    expect(provider.webhook).toBeDefined();
    expect(provider.health).toBeDefined();
  });

  it('hub port adapter delegates to provider', async () => {
    const def = PROVIDER_DEFINITIONS.find((d) => d.folder === 'stripe')!;
    const manifest = defineConnector({
      id: 'stripe-connector',
      name: 'stripe-connector',
      provider: 'stripe',
      version: '1.0.0',
      auth: def.auth,
    });
    const provider = createConnectorProvider(toProviderConfig(def, manifest));
    const hub = provider.toHubPort();
    const settings = Object.fromEntries(def.authRequiredKeys.map((k) => [k, 'sk_test']));
    const result = await hub.testConnection({ settings });
    expect(result.ok).toBe(true);
  });
});
