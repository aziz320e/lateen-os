/** @module testing/mock-connector */
import type { ConnectorManifest } from '../connector/types.js';

export function createMockConnector(overrides: Partial<ConnectorManifest> = {}): ConnectorManifest {
  return {
    id: 'mock-connector',
    name: 'Mock Connector',
    provider: 'mock',
    version: '1.0.0',
    description: 'Test connector',
    auth: { type: 'api_key', config: { header: 'X-API-Key' } },
    sync: { mode: 'pull', schedule: '0 * * * *' },
    sdkVersion: '1.0.0',
    ...overrides,
  };
}
