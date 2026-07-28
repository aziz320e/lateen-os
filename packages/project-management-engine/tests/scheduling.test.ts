import { describe, expect, it } from 'vitest';
import { computeCriticalPathSchedule, createSchedulingEngine, type ScheduleTaskInput } from '../src/scheduling/engine.impl.js';
import { createScheduleRepository } from '../src/scheduling/repository.impl.js';
import { ScheduleNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  return { engine: createSchedulingEngine(createScheduleRepository()) };
}

/**
 * Classic 4-task CPM fixture:
 *   A (3 days, no deps)
 *   B (2 days, depends on A)
 *   C (4 days, depends on A)
 *   D (1 day, depends on B and C)
 *
 * Hand-computed critical path: A -> C -> D (total duration 8 days).
 * B has 2 days of slack.
 */
const CPM_TASKS: readonly ScheduleTaskInput[] = [
  { taskId: 'A', durationDays: 3, dependsOnTaskIds: [] },
  { taskId: 'B', durationDays: 2, dependsOnTaskIds: ['A'] },
  { taskId: 'C', durationDays: 4, dependsOnTaskIds: ['A'] },
  { taskId: 'D', durationDays: 1, dependsOnTaskIds: ['B', 'C'] },
];

describe('computeCriticalPathSchedule (pure)', () => {
  it('computes correct early start/finish for every task', () => {
    const entries = computeCriticalPathSchedule(CPM_TASKS, '2026-01-01');
    const byId = new Map(entries.map((entry) => [entry.taskId, entry]));
    expect(byId.get('A')).toMatchObject({ earlyStart: 0, earlyFinish: 3 });
    expect(byId.get('B')).toMatchObject({ earlyStart: 3, earlyFinish: 5 });
    expect(byId.get('C')).toMatchObject({ earlyStart: 3, earlyFinish: 7 });
    expect(byId.get('D')).toMatchObject({ earlyStart: 7, earlyFinish: 8 });
  });

  it('computes correct late start/finish for every task', () => {
    const entries = computeCriticalPathSchedule(CPM_TASKS, '2026-01-01');
    const byId = new Map(entries.map((entry) => [entry.taskId, entry]));
    expect(byId.get('A')).toMatchObject({ lateStart: 0, lateFinish: 3 });
    expect(byId.get('B')).toMatchObject({ lateStart: 5, lateFinish: 7 });
    expect(byId.get('C')).toMatchObject({ lateStart: 3, lateFinish: 7 });
    expect(byId.get('D')).toMatchObject({ lateStart: 7, lateFinish: 8 });
  });

  it('computes correct slack and flags the critical path A -> C -> D', () => {
    const entries = computeCriticalPathSchedule(CPM_TASKS, '2026-01-01');
    const byId = new Map(entries.map((entry) => [entry.taskId, entry]));
    expect(byId.get('A')?.slack).toBe(0);
    expect(byId.get('A')?.isCritical).toBe(true);
    expect(byId.get('B')?.slack).toBe(2);
    expect(byId.get('B')?.isCritical).toBe(false);
    expect(byId.get('C')?.slack).toBe(0);
    expect(byId.get('C')?.isCritical).toBe(true);
    expect(byId.get('D')?.slack).toBe(0);
    expect(byId.get('D')?.isCritical).toBe(true);
  });

  it('resolves calendar start/finish dates from the project start date', () => {
    const entries = computeCriticalPathSchedule(CPM_TASKS, '2026-01-01');
    const byId = new Map(entries.map((entry) => [entry.taskId, entry]));
    expect(byId.get('A')).toMatchObject({ startDate: '2026-01-01', finishDate: '2026-01-04' });
    expect(byId.get('D')).toMatchObject({ startDate: '2026-01-08', finishDate: '2026-01-09' });
  });

  it('handles a single task with no dependencies', () => {
    const entries = computeCriticalPathSchedule([{ taskId: 'A', durationDays: 5, dependsOnTaskIds: [] }], '2026-01-01');
    expect(entries).toEqual([
      { taskId: 'A', durationDays: 5, earlyStart: 0, earlyFinish: 5, lateStart: 0, lateFinish: 5, slack: 0, isCritical: true, startDate: '2026-01-01', finishDate: '2026-01-06' },
    ]);
  });

  it('handles an empty task list', () => {
    expect(computeCriticalPathSchedule([], '2026-01-01')).toEqual([]);
  });

  it('handles fully parallel tasks with no dependencies — all critical', () => {
    const entries = computeCriticalPathSchedule(
      [
        { taskId: 'A', durationDays: 3, dependsOnTaskIds: [] },
        { taskId: 'B', durationDays: 5, dependsOnTaskIds: [] },
      ],
      '2026-01-01',
    );
    const byId = new Map(entries.map((entry) => [entry.taskId, entry]));
    expect(byId.get('A')?.isCritical).toBe(false);
    expect(byId.get('B')?.isCritical).toBe(true);
  });

  it('throws on a cyclic dependency graph', () => {
    const cyclic: readonly ScheduleTaskInput[] = [
      { taskId: 'A', durationDays: 1, dependsOnTaskIds: ['B'] },
      { taskId: 'B', durationDays: 1, dependsOnTaskIds: ['A'] },
    ];
    expect(() => computeCriticalPathSchedule(cyclic, '2026-01-01')).toThrow(/cyclic/i);
  });
});

describe('SchedulingEngine', () => {
  it('computeSchedule() persists a non-baseline schedule snapshot', async () => {
    const { engine } = setup();
    const schedule = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    expect(schedule.isBaseline).toBe(false);
    expect(schedule.entries).toHaveLength(4);
  });

  it('setBaseline() marks a schedule as the baseline', async () => {
    const { engine } = setup();
    const schedule = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    const baseline = await engine.setBaseline(ORG, schedule.id);
    expect(baseline.isBaseline).toBe(true);
    expect(await engine.getBaseline(ORG, PROJECT)).toEqual(baseline);
  });

  it('setBaseline() unmarks the previous baseline for the same project', async () => {
    const { engine } = setup();
    const first = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    await engine.setBaseline(ORG, first.id);
    const second = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-02-01', tasks: CPM_TASKS });
    await engine.setBaseline(ORG, second.id);

    const reloadedFirst = await engine.get(ORG, first.id);
    expect(reloadedFirst?.isBaseline).toBe(false);
    expect(await engine.getBaseline(ORG, PROJECT)).toMatchObject({ id: second.id });
  });

  it('getBaseline() returns null when no schedule has been marked baseline', async () => {
    const { engine } = setup();
    expect(await engine.getBaseline(ORG, PROJECT)).toBeNull();
  });

  it('setBaseline() throws for an unknown schedule', async () => {
    const { engine } = setup();
    await expect(engine.setBaseline(ORG, 'missing')).rejects.toBeInstanceOf(ScheduleNotFoundError);
  });

  it('getCriticalPath() returns only entries with zero slack', async () => {
    const { engine } = setup();
    const schedule = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    const criticalPath = await engine.getCriticalPath(ORG, schedule.id);
    expect(criticalPath.map((entry) => entry.taskId).sort()).toEqual(['A', 'C', 'D']);
  });

  it('findByProject() returns every schedule computed for a project', async () => {
    const { engine } = setup();
    await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-02-01', tasks: CPM_TASKS });
    await engine.computeSchedule(ORG, { projectId: 'other-project', projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    expect(await engine.findByProject(ORG, PROJECT)).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const schedule = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    expect(await engine.get(ORG, schedule.id)).toEqual(schedule);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('getCriticalPath() throws ScheduleNotFoundError for an unknown schedule', async () => {
    const { engine } = setup();
    await expect(engine.getCriticalPath(ORG, 'missing')).rejects.toBeInstanceOf(ScheduleNotFoundError);
  });

  it('schedules are isolated per organization', async () => {
    const { engine } = setup();
    await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    await engine.computeSchedule('org-2', { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });
});

describe('computeCriticalPathSchedule — a linear chain has zero slack throughout', () => {
  it('every task on a strictly sequential chain is critical', () => {
    const chain: readonly ScheduleTaskInput[] = [
      { taskId: 'A', durationDays: 2, dependsOnTaskIds: [] },
      { taskId: 'B', durationDays: 3, dependsOnTaskIds: ['A'] },
      { taskId: 'C', durationDays: 1, dependsOnTaskIds: ['B'] },
    ];
    const entries = computeCriticalPathSchedule(chain, '2026-01-01');
    expect(entries.every((entry) => entry.isCritical)).toBe(true);
    expect(entries.every((entry) => entry.slack === 0)).toBe(true);
  });

  it('a task with a zero-day duration is treated as a milestone with equal start/finish', () => {
    const entries = computeCriticalPathSchedule([{ taskId: 'M', durationDays: 0, dependsOnTaskIds: [] }], '2026-01-01');
    expect(entries[0]).toMatchObject({ earlyStart: 0, earlyFinish: 0, startDate: '2026-01-01', finishDate: '2026-01-01' });
  });

  it('setBaseline() is idempotent when called twice on the same schedule', async () => {
    const { engine } = setup();
    const schedule = await engine.computeSchedule(ORG, { projectId: PROJECT, projectStartDate: '2026-01-01', tasks: CPM_TASKS });
    await engine.setBaseline(ORG, schedule.id);
    const again = await engine.setBaseline(ORG, schedule.id);
    expect(again.isBaseline).toBe(true);
    expect(await engine.getBaseline(ORG, PROJECT)).toMatchObject({ id: schedule.id });
  });
});
