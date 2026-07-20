/** @module testing/mock-service */
import type { ServiceDefinition } from '../service/types.js';

export function createMockService(overrides: Partial<ServiceDefinition> = {}): ServiceDefinition {
  return {
    name: 'mock-service',
    displayName: 'Mock Service',
    description: 'Test service',
    port: 4999,
    packageName: '@lateen-os/mock-service',
    dependencies: [],
    apiRoutes: [{ method: 'GET', path: '/health' }],
    health: { path: '/health' },
    events: [{ name: 'mock.created' }],
    sdkVersion: '1.0.0',
    ...overrides,
  };
}
