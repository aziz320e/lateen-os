import { describe, expect, it } from 'vitest';
import { mapDiscoveryRun } from '../../src/repositories/mappers.js';

describe('mapDiscoveryRun', () => {
  it('maps prisma row to domain run', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000010',
      organizationId: '00000000-0000-4000-8000-000000000001',
      status: 'completed',
      currentStage: 'recommendation',
      keywords: [],
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-01T01:00:00.000Z'),
      errorMessage: null,
      stageResults: { rank: { opportunities: [] } },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T01:00:00.000Z'),
    };

    const run = mapDiscoveryRun(row);
    expect(run.status).toBe('completed');
    expect(run.rank?.opportunities).toEqual([]);
  });
});
