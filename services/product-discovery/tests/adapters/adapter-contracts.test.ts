/**
 * Signal adapter interface contracts — compile-time + runtime smoke.
 */
import { describe, expect, it } from 'vitest';
import { createAllMockAdapters } from '../../src/adapters/implementations/mock-adapters.js';
import type { ProductDiscoverySignalAdapter } from '../../src/adapters/index.js';

describe('adapter contracts', () => {
  it('mock adapters satisfy ProductDiscoverySignalAdapter union', () => {
    const adapters: readonly ProductDiscoverySignalAdapter[] = createAllMockAdapters();
    expect(adapters).toHaveLength(8);
    expect(adapters.map((adapter) => adapter.source)).toContain('google_trends');
  });
});
