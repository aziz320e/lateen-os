import { describe, expect, it, vi } from 'vitest';
import { createWorkerRepository } from '../src/worker/repository.impl.js';
import { canTransitionWorker, createWorkerLifecycle } from '../src/worker/lifecycle.impl.js';
import { createWorkforceEventBus } from '../src/events/workforce-event-bus.js';
import { InvalidWorkerTransitionError, WorkerNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function hireInput() {
  return {
    organizationId: ORG,
    businessDnaAgentId: 'agent-1',
    runtimeAgentId: 'runtime-agent-1',
    profile: {
      displayName: 'Sales Agent',
      title: 'AI Sales Rep',
      workforceType: 'sales_ai' as const,
      proactiveEnabled: true,
      reactiveEnabled: true,
    },
    maxConcurrentTasks: 2,
  };
}

describe('canTransitionWorker', () => {
  it('allows draft -> onboarding -> active -> suspended -> active', () => {
    expect(canTransitionWorker('draft', 'onboarding')).toBe(true);
    expect(canTransitionWorker('onboarding', 'active')).toBe(true);
    expect(canTransitionWorker('active', 'suspended')).toBe(true);
    expect(canTransitionWorker('suspended', 'active')).toBe(true);
  });

  it('rejects transitions out of terminal states', () => {
    expect(canTransitionWorker('archived', 'active')).toBe(false);
    expect(canTransitionWorker('offboarded', 'active')).toBe(false);
  });
});

describe('createWorkerLifecycle', () => {
  it('hire() creates a worker in draft status with unavailable availability', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    expect(worker.status).toBe('draft');
    expect(worker.lifecycle).toBe('registered');
    expect(worker.availability.state).toBe('unavailable');
    expect(worker.availability.maxConcurrentTasks).toBe(2);
    expect(worker.certifications).toEqual([]);
    expect(worker.toolAccess).toEqual([]);
  });

  it('activate() takes a draft worker through onboarding to active and sets availability', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    const activated = await lifecycle.activate(ORG, worker.id);
    expect(activated.status).toBe('active');
    expect(activated.lifecycle).toBe('activated');
    expect(activated.availability.state).toBe('available');
  });

  it('rejects activate() on an already-active worker', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, worker.id);
    await expect(lifecycle.activate(ORG, worker.id)).rejects.toBeInstanceOf(InvalidWorkerTransitionError);
  });

  it('suspend() and resume() round-trip and update availability', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, worker.id);

    const suspended = await lifecycle.suspend(ORG, worker.id, 'policy violation');
    expect(suspended.status).toBe('suspended');
    expect(suspended.availability.state).toBe('unavailable');

    const resumed = await lifecycle.resume(ORG, worker.id);
    expect(resumed.status).toBe('active');
    expect(resumed.availability.state).toBe('available');
  });

  it('rejects suspend() on a draft worker', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    await expect(lifecycle.suspend(ORG, worker.id)).rejects.toBeInstanceOf(InvalidWorkerTransitionError);
  });

  it('rejects resume() on a worker that was never suspended or paused', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, worker.id);
    await expect(lifecycle.resume(ORG, worker.id)).rejects.toBeInstanceOf(InvalidWorkerTransitionError);
  });

  it('retire() moves an active worker to offboarded and rejects retiring twice', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    const worker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, worker.id);
    const retired = await lifecycle.retire(ORG, worker.id);
    expect(retired.status).toBe('offboarded');
    await expect(lifecycle.retire(ORG, worker.id)).rejects.toBeInstanceOf(InvalidWorkerTransitionError);
  });

  it('throws WorkerNotFoundError for an unknown worker', async () => {
    const lifecycle = createWorkerLifecycle(createWorkerRepository());
    await expect(lifecycle.activate(ORG, 'missing')).rejects.toBeInstanceOf(WorkerNotFoundError);
  });

  it('publishes worker.hired, worker.activated, worker.suspended, worker.resumed, worker.retired', async () => {
    const eventBus = createWorkforceEventBus();
    const hired = vi.fn();
    const activated = vi.fn();
    const suspended = vi.fn();
    const resumed = vi.fn();
    const retired = vi.fn();
    eventBus.subscribe('worker.hired', hired);
    eventBus.subscribe('worker.activated', activated);
    eventBus.subscribe('worker.suspended', suspended);
    eventBus.subscribe('worker.resumed', resumed);
    eventBus.subscribe('worker.retired', retired);

    const lifecycle = createWorkerLifecycle(createWorkerRepository(), eventBus);
    const worker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, worker.id);
    await lifecycle.suspend(ORG, worker.id);
    await lifecycle.resume(ORG, worker.id);
    await lifecycle.retire(ORG, worker.id);
    await Promise.resolve();

    expect(hired).toHaveBeenCalledTimes(1);
    expect(activated).toHaveBeenCalledTimes(1);
    expect(suspended).toHaveBeenCalledTimes(1);
    expect(resumed).toHaveBeenCalledTimes(1);
    expect(retired).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const repository = createWorkerRepository();
    const lifecycle = createWorkerLifecycle(repository);
    const worker = await lifecycle.hire(hireInput());
    const fromOtherOrg = await repository.findById('org-2', worker.id);
    expect(fromOtherOrg).toBeNull();
  });
});
