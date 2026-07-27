import { describe, expect, it, vi } from 'vitest';
import { createWorkforceRuntime } from '../src/runtime.js';
import { NoSuitableWorkerError } from '../src/shared/errors.js';

const ORG = 'org-1';

function hireInput(overrides: Partial<{ roleCode: string; skillIds: string[]; maxConcurrentTasks: number }> = {}) {
  return {
    organizationId: ORG,
    businessDnaAgentId: 'agent-1',
    runtimeAgentId: 'runtime-agent-1',
    profile: {
      displayName: 'Worker',
      title: 'AI Worker',
      workforceType: 'sales_ai' as const,
      proactiveEnabled: true,
      reactiveEnabled: true,
    },
    roles: [{ roleId: 'role-1', code: overrides.roleCode ?? 'sales_ai', name: overrides.roleCode ?? 'sales_ai' }],
    skills: (overrides.skillIds ?? []).map((skillId, index) => ({
      workerSkillId: `ws-${index}`,
      skillId,
      name: skillId,
      level: 'advanced' as const,
      score: '0.8',
    })),
    maxConcurrentTasks: overrides.maxConcurrentTasks ?? 2,
  };
}

describe('createWorkforceRuntime — composition root', () => {
  it('exposes exactly the registry, lifecycle, assignment, capacity, performance, capabilities, queries, and events services', () => {
    const runtime = createWorkforceRuntime();
    expect(runtime.registry).toBeDefined();
    expect(runtime.lifecycle).toBeDefined();
    expect(runtime.assignment).toBeDefined();
    expect(runtime.capacity).toBeDefined();
    expect(runtime.performance).toBeDefined();
    expect(runtime.capabilities).toBeDefined();
    expect(runtime.queries).toBeDefined();
    expect(runtime.events).toBeDefined();
  });

  it('accepts an injected event bus and now() for determinism', async () => {
    const eventBus = createWorkforceRuntime().events;
    const fixedNow = () => '2024-01-01T00:00:00.000Z';
    const runtime = createWorkforceRuntime({ eventBus, now: fixedNow });
    const worker = await runtime.lifecycle.hire(hireInput());
    expect(worker.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('two independently created runtimes never share state', async () => {
    const runtimeA = createWorkforceRuntime();
    const runtimeB = createWorkforceRuntime();
    const worker = await runtimeA.lifecycle.hire(hireInput());
    expect(await runtimeB.lifecycle.get(ORG, worker.id)).toBeNull();
  });
});

describe('AI Workforce Runtime — end-to-end integration', () => {
  it('hire -> activate -> register -> assign -> complete flows through every real engine and updates queries/performance', async () => {
    const runtime = createWorkforceRuntime();
    const events: string[] = [];
    runtime.events.subscribeAll((name) => {
      events.push(name);
    });

    const worker = await runtime.lifecycle.hire(hireInput({ skillIds: ['skill-negotiation'] }));
    await runtime.lifecycle.activate(ORG, worker.id);
    await runtime.registry.register(worker);

    const assignment = await runtime.assignment.createAssignment(ORG, {
      taskId: 'task-1',
      roleCode: 'sales_ai',
      requirement: { requiredSkillIds: ['skill-negotiation'] },
      priority: 'high',
    });
    expect(assignment.workerId).toBe(worker.id);

    const midFlightCapacity = await runtime.queries.findCapacity({ organizationId: ORG, workerId: worker.id });
    expect(midFlightCapacity.snapshots[0]?.availableCapacity).toBe(1);

    await runtime.assignment.completeAssignment(ORG, assignment.id, '0.95');

    const performance = await runtime.queries.findPerformance({ organizationId: ORG, workerId: worker.id });
    expect(performance.taskStatistics?.totalCompleted).toBe(1);

    const restoredCapacity = await runtime.queries.findCapacity({ organizationId: ORG, workerId: worker.id });
    expect(restoredCapacity.snapshots[0]?.availableCapacity).toBe(2);

    expect(events).toEqual(
      expect.arrayContaining(['worker.hired', 'worker.activated', 'assignment.created', 'capacity.changed', 'assignment.completed', 'performance.updated']),
    );
  });

  it('a capability requirement the workforce cannot satisfy fails deterministically with no side effects', async () => {
    const runtime = createWorkforceRuntime();
    const worker = await runtime.lifecycle.hire(hireInput());
    await runtime.lifecycle.activate(ORG, worker.id);

    await expect(
      runtime.assignment.createAssignment(ORG, {
        taskId: 'task-1',
        roleCode: 'sales_ai',
        requirement: { requiredSkillIds: ['skill-nobody-has'] },
        priority: 'critical',
      }),
    ).rejects.toBeInstanceOf(NoSuitableWorkerError);

    const capacity = await runtime.queries.findCapacity({ organizationId: ORG, workerId: worker.id });
    expect(capacity.snapshots[0]?.availableCapacity).toBe(2);
  });

  it('a failed assignment is reflected in the performance failure rate', async () => {
    const runtime = createWorkforceRuntime();
    const worker = await runtime.lifecycle.hire(hireInput());
    await runtime.lifecycle.activate(ORG, worker.id);

    const assignment = await runtime.assignment.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'low' });
    await runtime.assignment.failAssignment(ORG, assignment.id, 'unrecoverable error');

    const performance = await runtime.queries.findPerformance({ organizationId: ORG, workerId: worker.id });
    expect(performance.taskStatistics?.totalFailed).toBe(1);
    expect(performance.score?.productivityScore).toBe('0.00');
  });

  it('suspending a worker mid-cycle removes them from findAvailableWorkers', async () => {
    const runtime = createWorkforceRuntime();
    const worker = await runtime.lifecycle.hire(hireInput());
    await runtime.lifecycle.activate(ORG, worker.id);
    expect((await runtime.queries.findAvailableWorkers({ organizationId: ORG })).total).toBe(1);

    await runtime.registry.deactivate(ORG, worker.id);
    expect((await runtime.queries.findAvailableWorkers({ organizationId: ORG })).total).toBe(0);
  });
});
