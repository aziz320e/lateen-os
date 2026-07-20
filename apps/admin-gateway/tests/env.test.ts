import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';

describe('admin-gateway env', () => {
  it('defaults gateway base URL', () => {
    expect(publicEnv.gatewayBaseUrl).toBe('http://localhost:4008');
  });
});
