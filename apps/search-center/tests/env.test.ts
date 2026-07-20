import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';

describe('search-center env', () => {
  it('defaults search base URL', () => {
    expect(publicEnv.searchBaseUrl).toBe('http://localhost:4010');
  });
});
