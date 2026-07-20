import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';
import { CONSOLE_SECTIONS, SUBSCRIPTION_PLANS } from '../src/lib/types/cloud';

describe('cloud-console env', () => {
  it('defaults cloud base URL', () => {
    expect(publicEnv.cloudBaseUrl).toBe('http://localhost:4012');
  });
});

describe('cloud-console contracts', () => {
  it('defines 11 console sections', () => {
    expect(CONSOLE_SECTIONS.length).toBe(11);
  });

  it('defines 5 subscription plans', () => {
    expect(SUBSCRIPTION_PLANS.length).toBe(5);
  });
});
