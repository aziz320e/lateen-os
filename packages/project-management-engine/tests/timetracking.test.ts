import { describe, expect, it } from 'vitest';
import { computeActualHours, computeIsOvertime, computeUtilizationPercentage, createTimeTrackingEngine, STANDARD_WORK_HOURS_PER_DAY } from '../src/timetracking/engine.impl.js';
import { createWorkLogRepository } from '../src/timetracking/repository.impl.js';
import type { WorkLog } from '../src/timetracking/types.js';

const ORG = 'org-1';
const PROJECT = 'project-1';
const TASK = 'task-1';

function setup() {
  return { engine: createTimeTrackingEngine(createWorkLogRepository()) };
}

function makeLog(overrides: Partial<WorkLog> = {}): WorkLog {
  return {
    id: 'log-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    projectId: PROJECT,
    taskId: TASK,
    assigneeId: 'employee-1',
    workDate: '2026-01-01',
    hoursLogged: 4,
    isOvertime: false,
    ...overrides,
  };
}

describe('computeIsOvertime (pure)', () => {
  it('flags hours beyond the standard 8-hour day', () => {
    expect(computeIsOvertime(8)).toBe(false);
    expect(computeIsOvertime(8.5)).toBe(true);
    expect(STANDARD_WORK_HOURS_PER_DAY).toBe(8);
  });

  it('respects a custom standard-hours threshold', () => {
    expect(computeIsOvertime(7, 6)).toBe(true);
    expect(computeIsOvertime(6, 6)).toBe(false);
  });
});

describe('computeActualHours (pure)', () => {
  it('sums hours across logs', () => {
    expect(computeActualHours([makeLog({ hoursLogged: 4 }), makeLog({ hoursLogged: 3.5 })])).toBe(7.5);
  });

  it('returns 0 for an empty list', () => {
    expect(computeActualHours([])).toBe(0);
  });
});

describe('computeUtilizationPercentage (pure)', () => {
  it('computes the percentage of estimated hours consumed', () => {
    expect(computeUtilizationPercentage(5, 10)).toBe(50);
    expect(computeUtilizationPercentage(12, 10)).toBe(120);
  });

  it('returns 0 when no estimate was set', () => {
    expect(computeUtilizationPercentage(5, undefined)).toBe(0);
    expect(computeUtilizationPercentage(5, 0)).toBe(0);
  });
});

describe('TimeTrackingEngine', () => {
  it('logWork() records an immutable work log with isOvertime computed', async () => {
    const { engine } = setup();
    const log = await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 9 });
    expect(log.isOvertime).toBe(true);
  });

  it('logWork() does not flag a standard 8-hour day as overtime', async () => {
    const { engine } = setup();
    const log = await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 6 });
    expect(log.isOvertime).toBe(false);
  });

  it('logWork() accepts optional notes', async () => {
    const { engine } = setup();
    const log = await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 4, notes: 'Pair programming' });
    expect(log.notes).toBe('Pair programming');
  });

  it('getActualHoursForTask() sums logged hours for a task', async () => {
    const { engine } = setup();
    await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 4 });
    await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-2', workDate: '2026-01-02', hoursLogged: 3 });
    expect(await engine.getActualHoursForTask(ORG, TASK)).toBe(7);
  });

  it('getTaskUtilization() computes percentage of estimated hours', async () => {
    const { engine } = setup();
    await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 5 });
    expect(await engine.getTaskUtilization(ORG, TASK, 10)).toBe(50);
  });

  it('findByProject / findByTask / findByAssignee filter correctly', async () => {
    const { engine } = setup();
    const log = await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 4 });
    await engine.logWork(ORG, { projectId: 'other-project', taskId: 'other-task', assigneeId: 'employee-2', workDate: '2026-01-01', hoursLogged: 4 });

    expect(await engine.findByProject(ORG, PROJECT)).toEqual([log]);
    expect(await engine.findByTask(ORG, TASK)).toEqual([log]);
    expect(await engine.findByAssignee(ORG, 'employee-1')).toEqual([log]);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const log = await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 4 });
    expect(await engine.get(ORG, log.id)).toEqual(log);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('getActualHoursForTask() returns 0 for a task with no logs', async () => {
    const { engine } = setup();
    expect(await engine.getActualHoursForTask(ORG, 'unknown-task')).toBe(0);
  });

  it('work logs are isolated per organization', async () => {
    const { engine } = setup();
    await engine.logWork(ORG, { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 4 });
    await engine.logWork('org-2', { projectId: PROJECT, taskId: TASK, assigneeId: 'employee-1', workDate: '2026-01-01', hoursLogged: 4 });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });
});
