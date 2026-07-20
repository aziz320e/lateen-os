import { describe, expect, it } from 'vitest';

describe('Marketplace App', () => {
  it('exports public env defaults', async () => {
    const { publicEnv } = await import('../src/lib/env');
    expect(publicEnv.marketplaceBaseUrl).toContain('4006');
  });
});
