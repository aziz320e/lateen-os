import { describe, expect, it, vi } from 'vitest';
import { createWorkerLifecycle } from '../src/worker/lifecycle.impl.js';
import { createWorkerRepository } from '../src/worker/repository.impl.js';
import { createSkillDefinitionRepository } from '../src/skills/repository.impl.js';
import { createCapabilityEngine } from '../src/skills/capability-engine.impl.js';
import { createCapacityEngine } from '../src/availability/capacity-engine.impl.js';
import { createTaskAssignmentRepository } from '../src/collaboration/repository.impl.js';
import { createAssignmentEngine } from '../src/assignment/engine.impl.js';
import { createWorkforceEventBus } from '../src/events/workforce-event-bus.js';
import { AssignmentNotFoundError, InvalidAssignmentTransitionError, NoSuitableWorkerError } from '../src/shared/errors.js';

const ORG = 'org-1';

async function setup() {
  const workerRepository = createWorkerRepository();
  const lifecycle = createWorkerLifecycle(workerRepository);
  const capabilityEngine = createCapabilityEngine(createSkillDefinitionRepository());
  const capacityEngine = createCapacityEngine(workerRepository);
  const assignmentRepository = createTaskAssignmentRepository();
  const eventBus = createWorkforceEventBus();

  const engine = createAssignmentEngine({
    workerRepository,
    assignmentRepository,
    capacityEngine,
    capabilityEngine,
    eventBus,
  });

  return { workerRepository, lifecycle, engine, eventBus, assignmentRepository };
}

async function hireActiveWorker(
  lifecycle: ReturnType<typeof createWorkerLifecycle>,
  opts: { roleCode: string; skillIds?: string[]; maxConcurrentTasks?: number },
) {
  const worker = await lifecycle.hire({
    organizationId: ORG,
    businessDnaAgentId: 'agent-1',
    runtimeAgentId: 'runtime-agent-1',
    profile: {
      displayName: 'Worker',
      title: 'AI Worker',
      workforceType: 'sales_ai',
      proactiveEnabled: true,
      reactiveEnabled: true,
    },
    roles: [{ roleId: 'role-1', code: opts.roleCode, name: opts.roleCode }],
    skills: (opts.skillIds ?? []).map((skillId, index) => ({
      workerSkillId: `ws-${index}`,
      skillId,
      name: skillId,
      level: 'advanced' as const,
      score: '0.8',
    })),
    maxConcurrentTasks: opts.maxConcurrentTasks ?? 1,
  });
  return lifecycle.activate(ORG, worker.id);
}

describe('createAssignmentEngine', () => {
  it('selects the worker with the best capability match score', async () => {
    const { lifecycle, engine } = await setup();
    const weak = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', skillIds: [] });
    const strong = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', skillIds: ['skill-negotiation'] });

    const assignment = await engine.createAssignment(ORG, {
      taskId: 'task-1',
      roleCode: 'sales_ai',
      requirement: { requiredSkillIds: ['skill-negotiation'] },
      priority: 'high',
    });

    expect(assignment.workerId).toBe(strong.id);
    expect(assignment.workerId).not.toBe(weak.id);
    expect(assignment.status).toBe('accepted');
  });

  it('breaks ties deterministically by remaining capacity, then worker id', async () => {
    const { lifecycle, engine } = await setup();
    const lowCapacity = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 1 });
    const highCapacity = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 5 });

    const assignment = await engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'normal' });
    expect(assignment.workerId).toBe(highCapacity.id);
    expect(assignment.workerId).not.toBe(lowCapacity.id);
  });

  it('excludes workers without remaining capacity', async () => {
    const { lifecycle, engine, workerRepository } = await setup();
    const full = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 1 });
    const capacityEngine = createCapacityEngine(workerRepository);
    await capacityEngine.reserve(ORG, full.id);

    await expect(engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'normal' })).rejects.toBeInstanceOf(
      NoSuitableWorkerError,
    );
  });

  it('reserves capacity when creating an assignment', async () => {
    const { lifecycle, engine, workerRepository } = await setup();
    const worker = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 1 });
    await engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'normal' });

    const reloaded = await workerRepository.findById(ORG, worker.id);
    expect(reloaded?.availability.activeTaskCount).toBe(1);
  });

  it('completeAssignment() releases capacity and publishes assignment.completed', async () => {
    const { lifecycle, engine, workerRepository, eventBus } = await setup();
    const handler = vi.fn();
    eventBus.subscribe('assignment.completed', handler);
    const worker = await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 1 });

    const assignment = await engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'normal' });
    const completed = await engine.completeAssignment(ORG, assignment.id, '0.95');
    await Promise.resolve();

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
    const reloaded = await workerRepository.findById(ORG, worker.id);
    expect(reloaded?.availability.activeTaskCount).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('failAssignment() releases capacity and publishes assignment.failed with a reason', async () => {
    const { lifecycle, engine, eventBus } = await setup();
    const handler = vi.fn();
    eventBus.subscribe('assignment.failed', handler);
    await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 1 });

    const assignment = await engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'normal' });
    const failed = await engine.failAssignment(ORG, assignment.id, 'timeout');
    await Promise.resolve();

    expect(failed.status).toBe('failed');
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'timeout' }),
      expect.any(Object),
    );
  });

  it('rejects completing/failing an already-terminal assignment', async () => {
    const { lifecycle, engine } = await setup();
    await hireActiveWorker(lifecycle, { roleCode: 'sales_ai', maxConcurrentTasks: 1 });
    const assignment = await engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'normal' });
    await engine.completeAssignment(ORG, assignment.id);
    await expect(engine.completeAssignment(ORG, assignment.id)).rejects.toBeInstanceOf(InvalidAssignmentTransitionError);
  });

  it('throws AssignmentNotFoundError for an unknown assignment', async () => {
    const { engine } = await setup();
    await expect(engine.completeAssignment(ORG, 'missing')).rejects.toBeInstanceOf(AssignmentNotFoundError);
  });

  it('throws NoSuitableWorkerError when no worker matches the role', async () => {
    const { engine } = await setup();
    await expect(engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'ceo_ai', priority: 'critical' })).rejects.toBeInstanceOf(
      NoSuitableWorkerError,
    );
  });

  it('publishes assignment.created', async () => {
    const { lifecycle, engine, eventBus } = await setup();
    const handler = vi.fn();
    eventBus.subscribe('assignment.created', handler);
    await hireActiveWorker(lifecycle, { roleCode: 'sales_ai' });
    await engine.createAssignment(ORG, { taskId: 'task-1', roleCode: 'sales_ai', priority: 'critical' });
    await Promise.resolve();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'task-1', priority: 'critical' }), expect.any(Object));
  });
});
