import { describe, expect, it } from 'vitest';
import { createWorkforceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

function hireInput(roleCode: string) {
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
    roles: [{ roleId: 'role-1', code: roleCode, name: roleCode }],
    maxConcurrentTasks: 2,
  };
}

describe('createWorkforceRuntimeQueries (via createWorkforceRuntime)', () => {
  it('findWorkers() filters by status', async () => {
    const runtime = createWorkforceRuntime();
    const draft = await runtime.lifecycle.hire(hireInput('sales_ai'));
    const active = await runtime.lifecycle.hire(hireInput('sales_ai'));
    await runtime.lifecycle.activate(ORG, active.id);

    const activeOnly = await runtime.queries.findWorkers({ organizationId: ORG, status: 'active' });
    expect(activeOnly.workers.map((w) => w.id)).toEqual([active.id]);
    expect(activeOnly.workers.map((w) => w.id)).not.toContain(draft.id);
  });

  it('findAvailableWorkers() only returns workers with available capacity, optionally by role', async () => {
    const runtime = createWorkforceRuntime();
    const salesWorker = await runtime.lifecycle.hire(hireInput('sales_ai'));
    await runtime.lifecycle.activate(ORG, salesWorker.id);
    const opsWorker = await runtime.lifecycle.hire(hireInput('operations_ai'));
    await runtime.lifecycle.activate(ORG, opsWorker.id);

    const salesOnly = await runtime.queries.findAvailableWorkers({ organizationId: ORG, roleCode: 'sales_ai' });
    expect(salesOnly.workers.map((w) => w.id)).toEqual([salesWorker.id]);
  });

  it('findAssignments() filters by worker/status', async () => {
    const runtime = createWorkforceRuntime();
    const worker = await runtime.lifecycle.hire(hireInput('sales_ai'));
    await runtime.lifecycle.activate(ORG, worker.id);
    const assignment = await runtime.assignment.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'high' });

    const byWorker = await runtime.queries.findAssignments({ organizationId: ORG, workerId: worker.id });
    expect(byWorker.assignments.map((a) => a.id)).toEqual([assignment.id]);

    const byStatus = await runtime.queries.findAssignments({ organizationId: ORG, status: 'completed' });
    expect(byStatus.total).toBe(0);
  });

  it('findCapabilities() returns the organization skill catalog', async () => {
    const runtime = createWorkforceRuntime();
    const result = await runtime.queries.findCapabilities({ organizationId: ORG });
    expect(result.skills).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('findPerformance() combines metrics, score, and task statistics', async () => {
    const runtime = createWorkforceRuntime();
    const worker = await runtime.lifecycle.hire(hireInput('sales_ai'));
    await runtime.lifecycle.activate(ORG, worker.id);
    const assignment = await runtime.assignment.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'high' });
    await runtime.assignment.completeAssignment(ORG, assignment.id, '0.9');

    const performance = await runtime.queries.findPerformance({ organizationId: ORG, workerId: worker.id });
    expect(performance.taskStatistics?.totalCompleted).toBe(1);
    expect(performance.score?.productivityScore).toBe('1.00');
    expect(performance.metrics).toHaveLength(1);
  });

  it('findCapacity() returns a snapshot per worker, or one worker when workerId is given', async () => {
    const runtime = createWorkforceRuntime();
    const worker = await runtime.lifecycle.hire(hireInput('sales_ai'));
    await runtime.lifecycle.activate(ORG, worker.id);

    const single = await runtime.queries.findCapacity({ organizationId: ORG, workerId: worker.id });
    expect(single.snapshots).toHaveLength(1);
    expect(single.snapshots[0]?.state).toBe('available');

    const all = await runtime.queries.findCapacity({ organizationId: ORG });
    expect(all.snapshots).toHaveLength(1);
  });

  it('does not expose repositories on the runtime surface', () => {
    const runtime = createWorkforceRuntime();
    expect((runtime as Record<string, unknown>).workerRepository).toBeUndefined();
    expect((runtime as Record<string, unknown>).assignmentRepository).toBeUndefined();
    expect(Object.keys(runtime).sort()).toEqual(
      ['assignment', 'capabilities', 'capacity', 'events', 'lifecycle', 'performance', 'queries', 'registry'].sort(),
    );
  });
});
