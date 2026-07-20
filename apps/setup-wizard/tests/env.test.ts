import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';

describe('Setup Wizard', () => {
  it('has provisioning base URL configured', () => {
    expect(publicEnv.provisioningBaseUrl).toContain('4007');
  });
});
