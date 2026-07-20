import { describe, expect, it } from 'vitest';
import { createMockSignalAdapter } from '../../src/adapters/implementations/mock-adapters.js';
import { randomUUID } from 'node:crypto';

describe('Mock signal adapters', () => {
  it('returns deterministic mock signals without HTTP', async () => {
    const adapter = createMockSignalAdapter('google_trends');
    const organizationId = randomUUID();
    const response = await adapter.collectSignals({
      organizationId: organizationId as never,
      keywords: ['signage'],
      limit: 1,
    });

    expect(response.source).toBe('google_trends');
    expect(response.signals).toHaveLength(1);
    expect(response.signals[0]?.rawPayload).toMatchObject({ mock: true });
  });
});
