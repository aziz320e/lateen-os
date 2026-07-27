import { describe, expect, it, vi } from 'vitest';
import { createWorkerLifecycle } from '../src/worker/lifecycle.impl.js';
import { createWorkerRepository } from '../src/worker/repository.impl.js';
import { createCapacityEngine } from '../src/availability/capacity-engine.impl.js';
import { createWorkforceEventBus } from '../src/events/workforce-event-bus.js';
import { CapacityExceededError } from '../src/shared/errors.js';

const ORG = 'org-1';

async function makeActiveWorker(workerRepository: ReturnType<typeof createWorkerRepository>, maxConcurrentTasks = 2) {
  const lifecycle = createWorkerLifecycle(workerRepository);
  const worker = await lifecycle.hire({
    organizationId: ORG,
    businessDnaAgentId: 'agent-1',
    runtimeAgentId: 'runtime-agent-1',
    profile: {
      displayName: 'Marketing Agent',
      title: 'AI Marketing',
      workforceType: 'marketing_ai',
      proactiveEnabled: true,
      reactiveEnabled: true,
    },
    maxConcurrentTasks,
  });
  return lifecycle.activate(ORG, worker.id);
}

describe('createCapacityEngine', () => {
  it('currentWorkload/maxConcurrentMissions/remainingCapacity read straight off availability', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 3);
    const engine = createCapacityEngine(workerRepository);
    expect(engine.currentWorkload(worker)).toBe(0);
    expect(engine.maxConcurrentMissions(worker)).toBe(3);
    expect(engine.remainingCapacity(worker)).toBe(3);
  });

  it('reserve() increments activeTaskCount and flips to "limited" at max capacity', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 1);
    const engine = createCapacityEngine(workerRepository);

    const reserved = await engine.reserve(ORG, worker.id);
    expect(reserved.availability.activeTaskCount).toBe(1);
    expect(reserved.availability.state).toBe('limited');
    expect(engine.remainingCapacity(reserved)).toBe(0);
  });

  it('reserve() throws CapacityExceededError once capacity is exhausted', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 1);
    const engine = createCapacityEngine(workerRepository);

    await engine.reserve(ORG, worker.id);
    await expect(engine.reserve(ORG, worker.id)).rejects.toBeInstanceOf(CapacityExceededError);
  });

  it('release() decrements activeTaskCount and restores "available"', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 1);
    const engine = createCapacityEngine(workerRepository);

    await engine.reserve(ORG, worker.id);
    const released = await engine.release(ORG, worker.id);
    expect(released.availability.activeTaskCount).toBe(0);
    expect(released.availability.state).toBe('available');
  });

  it('release() never drops activeTaskCount below zero', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 1);
    const engine = createCapacityEngine(workerRepository);

    const released = await engine.release(ORG, worker.id);
    expect(released.availability.activeTaskCount).toBe(0);
  });

  it('calculateAvailability() never overrides an explicit unavailable/scheduled state', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 1);
    const engine = createCapacityEngine(workerRepository);
    const suspended = { ...worker, availability: { ...worker.availability, state: 'unavailable' as const } };
    expect(engine.calculateAvailability(suspended).state).toBe('unavailable');
  });

  it('reserve() cannot be called on a worker whose availability is unavailable', async () => {
    const workerRepository = createWorkerRepository();
    const lifecycle = createWorkerLifecycle(workerRepository);
    const worker = await lifecycle.hire({
      organizationId: ORG,
      businessDnaAgentId: 'agent-1',
      runtimeAgentId: 'runtime-agent-1',
      profile: {
        displayName: 'Draft Agent',
        title: 'AI Draft',
        workforceType: 'marketing_ai',
        proactiveEnabled: true,
        reactiveEnabled: true,
      },
    });
    const engine = createCapacityEngine(workerRepository);
    await expect(engine.reserve(ORG, worker.id)).rejects.toBeInstanceOf(CapacityExceededError);
  });

  it('publishes capacity.changed on reserve and release', async () => {
    const workerRepository = createWorkerRepository();
    const worker = await makeActiveWorker(workerRepository, 2);
    const eventBus = createWorkforceEventBus();
    const handler = vi.fn();
    eventBus.subscribe('capacity.changed', handler);
    const engine = createCapacityEngine(workerRepository, eventBus);

    await engine.reserve(ORG, worker.id);
    await engine.release(ORG, worker.id);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
