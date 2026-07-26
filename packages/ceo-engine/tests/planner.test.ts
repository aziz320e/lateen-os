import { describe, expect, it } from 'vitest';
import { createPlanner } from '../src/planner.js';
import type { Mission } from '../src/types.js';

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    organizationId: 'org-1',
    title: 'Untitled mission',
    description: '',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('createPlanner', () => {
  it('routes a mission to the agent matching its keywords', () => {
    const planner = createPlanner();
    const tasks = planner.plan(makeMission({ title: 'Improve SEO keyword rankings' }));

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ agent: 'seo', missionId: 'mission-1' });
  });

  it('falls back to "operations" when no agent keyword matches', () => {
    const planner = createPlanner();
    const tasks = planner.plan(makeMission({ title: 'Something unrelated', description: 'no matching terms here' }));

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.agent).toBe('operations');
  });

  it('produces one task per matched agent when a mission spans domains', () => {
    const planner = createPlanner();
    const tasks = planner.plan(
      makeMission({ title: 'Coordinate a sales and marketing campaign', description: 'align pipeline with brand messaging' }),
    );

    const agents = tasks.map((task) => task.agent);
    expect(agents).toContain('sales');
    expect(agents).toContain('marketing');
  });

  it('uses the mission description as the task instruction when present', () => {
    const planner = createPlanner();
    const tasks = planner.plan(makeMission({ title: 'Finance review', description: 'Reforecast Q3 budget' }));

    expect(tasks[0]?.instruction).toBe('Reforecast Q3 budget');
  });
});
