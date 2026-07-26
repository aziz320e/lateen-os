import { describe, expect, it, vi } from 'vitest';
import { createTaskRepository } from '../src/task/repository.impl.js';
import { createTaskQueueService } from '../src/task/task-queue.impl.js';
import { createTaskExecutor } from '../src/task/task-executor.impl.js';
import type { Task } from '../src/task/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 'task-1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    title: 'Do work',
    runtimeAgentId: 'agent-1',
    priority: 'normal',
    status: 'queued',
    ...overrides,
  };
}

describe('createTaskQueueService', () => {
  it('dequeue returns null when there is nothing queued', async () => {
    const service = createTaskQueueService(createTaskRepository());
    await expect(service.dequeue(ORG)).resolves.toBeNull();
  });

  it('dequeue picks the highest-priority task first', async () => {
    const repo = createTaskRepository();
    const service = createTaskQueueService(repo);
    await service.enqueue(makeTask({ id: 'low', priority: 'low' }));
    await service.enqueue(makeTask({ id: 'critical', priority: 'critical' }));

    const next = await service.dequeue(ORG);
    expect(next?.id).toBe('critical');
    expect(next?.status).toBe('assigned');
  });

  it('dequeue does not return an already-assigned task twice', async () => {
    const repo = createTaskRepository();
    const service = createTaskQueueService(repo);
    await service.enqueue(makeTask({ id: 'only' }));

    const first = await service.dequeue(ORG);
    const second = await service.dequeue(ORG);
    expect(first?.id).toBe('only');
    expect(second).toBeNull();
  });

  it('getQueue lists queued task ids in priority order', async () => {
    const repo = createTaskRepository();
    const service = createTaskQueueService(repo);
    await service.enqueue(makeTask({ id: 'normal', priority: 'normal' }));
    await service.enqueue(makeTask({ id: 'high', priority: 'high' }));

    const queue = await service.getQueue(ORG);
    expect(queue.taskIds).toEqual(['high', 'normal']);
  });
});

describe('createTaskExecutor', () => {
  it('marks the task completed when the handler succeeds', async () => {
    const repo = createTaskRepository();
    const executor = createTaskExecutor(repo);
    const task = makeTask();

    const result = await executor.execute(task, async () => ({ success: true, output: 'done' }));
    expect(result.status).toBe('completed');
    expect(result.result?.output).toBe('done');
  });

  it('marks the task failed when the handler returns success: false', async () => {
    const repo = createTaskRepository();
    const executor = createTaskExecutor(repo);
    const task = makeTask();

    const result = await executor.execute(task, async () => ({ success: false, errorCode: 'BAD_INPUT' }));
    expect(result.status).toBe('failed');
    expect(result.result?.errorCode).toBe('BAD_INPUT');
  });

  it('marks the task failed (not throwing) when the handler throws after retries are exhausted', async () => {
    const repo = createTaskRepository();
    const executor = createTaskExecutor(repo);
    const task = makeTask();
    const handler = vi.fn().mockRejectedValue(new Error('boom'));

    const result = await executor.execute(task, handler, { retry: { maxAttempts: 2, baseDelayMs: 1 } });
    expect(result.status).toBe('failed');
    expect(result.result?.errorCode).toBe('EXECUTION_ERROR');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('persists the running status before the handler resolves', async () => {
    const repo = createTaskRepository();
    const executor = createTaskExecutor(repo);
    const task = makeTask();

    let sawRunning = false;
    await executor.execute(task, async () => {
      const stored = await repo.findById(ORG, task.id);
      sawRunning = stored?.status === 'running';
      return { success: true };
    });
    expect(sawRunning).toBe(true);
  });
});
