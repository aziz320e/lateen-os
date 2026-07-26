import { describe, expect, it } from 'vitest';
import { createTaskRepository } from '../src/task/repository.impl.js';
import { createScheduleRepository } from '../src/scheduler/repository.impl.js';
import { createScheduler } from '../src/scheduler/scheduler.impl.js';
import type { Task } from '../src/task/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function makeTask(): Task {
  return { id: 'task-1', organizationId: ORG, createdAt: now, updatedAt: now, title: 'A', runtimeAgentId: 'agent-1', priority: 'normal', status: 'queued' };
}

describe('createScheduler', () => {
  it('scheduleTask creates an enabled schedule for an existing task', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const scheduleRepository = createScheduleRepository();
    const scheduler = createScheduler({ scheduleRepository, taskRepository });

    const schedule = await scheduler.scheduleTask(ORG, 'task-1');
    expect(schedule.enabled).toBe(true);
    expect(schedule.taskId).toBe('task-1');
  });

  it('scheduleTask throws for an unknown task', async () => {
    const scheduler = createScheduler({ scheduleRepository: createScheduleRepository(), taskRepository: createTaskRepository() });
    await expect(scheduler.scheduleTask(ORG, 'missing')).rejects.toThrow(/not found/);
  });

  it('cancelSchedule disables an existing schedule', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const scheduleRepository = createScheduleRepository();
    const scheduler = createScheduler({ scheduleRepository, taskRepository });

    const schedule = await scheduler.scheduleTask(ORG, 'task-1');
    await scheduler.cancelSchedule(ORG, schedule.id);

    const stored = await scheduleRepository.findById(ORG, schedule.id);
    expect(stored?.enabled).toBe(false);
  });

  it('listDueSchedules returns only enabled schedules whose nextRunAt has passed', async () => {
    const taskRepository = createTaskRepository([makeTask()]);
    const scheduleRepository = createScheduleRepository();
    const clock = () => new Date('2026-01-01T00:00:00.000Z');
    const scheduler = createScheduler({
      scheduleRepository,
      taskRepository,
      clock,
      listAllSchedules: (organizationId) => scheduleRepository.findByAgent(organizationId, 'agent-1'),
    });

    await scheduler.scheduleTask(ORG, 'task-1');

    const due = await scheduler.listDueSchedules(ORG, new Date('2026-01-02T00:00:00.000Z'));
    expect(due).toHaveLength(1);

    const notYetDue = await scheduler.listDueSchedules(ORG, new Date('2025-12-31T00:00:00.000Z'));
    expect(notYetDue).toHaveLength(0);
  });
});
