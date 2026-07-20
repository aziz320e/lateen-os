import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';
import { STUDIO_SECTIONS, WORKER_TOOLS } from '../src/lib/types/studio';
import { MOCK_WORKERS, getWorker } from '../src/lib/mock-data';

describe('ai-studio env', () => {
  it('defaults workforce base URL', () => {
    expect(publicEnv.workforceBaseUrl).toBe('http://localhost:4008');
  });
});

describe('ai-studio contracts', () => {
  it('defines 17 studio sections', () => {
    expect(STUDIO_SECTIONS.length).toBe(17);
  });

  it('defines 11 worker tools', () => {
    expect(WORKER_TOOLS.length).toBe(11);
  });

  it('resolves mock workers', () => {
    expect(getWorker('worker-printing-planner')?.name).toBe('Printing Planner');
    expect(MOCK_WORKERS.length).toBeGreaterThanOrEqual(2);
  });
});
