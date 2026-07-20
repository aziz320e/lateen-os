import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';
import { CENTER_SECTIONS, DASHBOARD_IDS } from '../src/lib/types/analytics';

describe('analytics-center env', () => {
  it('defaults analytics base URL', () => {
    expect(publicEnv.analyticsBaseUrl).toBe('http://localhost:4011');
  });
});

describe('analytics-center contracts', () => {
  it('defines 6 center sections', () => {
    expect(CENTER_SECTIONS.length).toBe(6);
  });

  it('defines 10 dashboards', () => {
    expect(DASHBOARD_IDS.length).toBe(10);
  });
});
