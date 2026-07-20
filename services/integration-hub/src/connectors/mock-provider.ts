import type { ConnectorConfiguration } from '../domain/types';
import type { ConnectorProviderPort } from '../domain/ports';

/** Mock connector provider — simulates external API without network calls. */

export class MockConnectorProvider implements ConnectorProviderPort {
  constructor(readonly definitionCode: string) {}

  async testConnection(_config: ConnectorConfiguration): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: `Mock connection OK for ${this.definitionCode}` };
  }

  async authenticate(_config: ConnectorConfiguration): Promise<{ ok: boolean; credentialsRef?: string }> {
    return { ok: true, credentialsRef: `mock-cred-${this.definitionCode}-${Date.now()}` };
  }

  async pull(_config: ConnectorConfiguration, entity: string): Promise<{ records: unknown[]; count: number }> {
    const records = [{ id: `${entity}-mock-1`, source: this.definitionCode }];
    return { records, count: records.length };
  }

  async push(_config: ConnectorConfiguration, _entity: string, records: unknown[]): Promise<{ accepted: number }> {
    return { accepted: records.length };
  }
}

const providerCache = new Map<string, MockConnectorProvider>();

export function getMockProvider(definitionCode: string): MockConnectorProvider {
  if (!providerCache.has(definitionCode)) {
    providerCache.set(definitionCode, new MockConnectorProvider(definitionCode));
  }
  return providerCache.get(definitionCode)!;
}

export function registerMockProviders(codes: string[]): Map<string, MockConnectorProvider> {
  const map = new Map<string, MockConnectorProvider>();
  for (const code of codes) {
    map.set(code, getMockProvider(code));
  }
  return map;
}
