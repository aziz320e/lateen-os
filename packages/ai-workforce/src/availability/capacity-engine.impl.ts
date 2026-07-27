/**
 * Real Capacity Engine — tracks workload, remaining capacity, and
 * availability for workers, and reserves/releases capacity for
 * assignments. Operates purely over {@link WorkerAvailability}; never
 * touches a worker's lifecycle {@link WorkerStatus}.
 *
 * @module availability/capacity-engine.impl
 */
import type { WorkforceEventBus } from '../events/workforce-event-bus.js';
import { CapacityExceededError, WorkerNotFoundError } from '../shared/errors.js';
import { nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { WorkerRepository } from '../worker/repository.js';
import type { AIWorker, AvailabilityState, WorkerId } from '../worker/types.js';
import type { AvailabilitySnapshot } from './types.js';

const RESERVABLE_STATES: readonly AvailabilityState[] = ['available', 'limited'];

function deriveState(activeTaskCount: number, maxConcurrentTasks: number, current: AvailabilityState): AvailabilityState {
  if (current === 'unavailable' || current === 'scheduled') return current;
  return activeTaskCount >= maxConcurrentTasks ? 'limited' : 'available';
}

export interface CapacityEngine {
  currentWorkload(worker: AIWorker): number;
  maxConcurrentMissions(worker: AIWorker): number;
  remainingCapacity(worker: AIWorker): number;
  calculateAvailability(worker: AIWorker, at?: string): AvailabilitySnapshot;
  reserve(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker>;
  release(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker>;
}

/** Creates a real {@link CapacityEngine} backed by a {@link WorkerRepository}. */
export function createCapacityEngine(repository: WorkerRepository, eventBus?: WorkforceEventBus, now: () => string = nowIso): CapacityEngine {
  async function requireWorker(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker> {
    const worker = await repository.findById(organizationId, workerId);
    if (!worker) throw new WorkerNotFoundError(workerId);
    return worker;
  }

  function remainingCapacity(worker: AIWorker): number {
    return Math.max(0, worker.availability.maxConcurrentTasks - worker.availability.activeTaskCount);
  }

  return {
    currentWorkload(worker) {
      return worker.availability.activeTaskCount;
    },

    maxConcurrentMissions(worker) {
      return worker.availability.maxConcurrentTasks;
    },

    remainingCapacity,

    calculateAvailability(worker, at = now()) {
      return {
        workerId: worker.id,
        state: deriveState(worker.availability.activeTaskCount, worker.availability.maxConcurrentTasks, worker.availability.state),
        availableCapacity: remainingCapacity(worker),
        checkedAt: at,
      };
    },

    async reserve(organizationId, workerId) {
      const worker = await requireWorker(organizationId, workerId);
      if (!RESERVABLE_STATES.includes(worker.availability.state) || remainingCapacity(worker) <= 0) {
        throw new CapacityExceededError(workerId, worker.availability.maxConcurrentTasks);
      }
      const activeTaskCount = worker.availability.activeTaskCount + 1;
      const state = deriveState(activeTaskCount, worker.availability.maxConcurrentTasks, worker.availability.state);
      const updated: AIWorker = {
        ...worker,
        availability: { ...worker.availability, activeTaskCount, state },
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('capacity.changed', {
        workerId,
        activeTaskCount,
        maxConcurrentTasks: updated.availability.maxConcurrentTasks,
        state,
      });
      return updated;
    },

    async release(organizationId, workerId) {
      const worker = await requireWorker(organizationId, workerId);
      const activeTaskCount = Math.max(0, worker.availability.activeTaskCount - 1);
      const state = deriveState(activeTaskCount, worker.availability.maxConcurrentTasks, worker.availability.state);
      const updated: AIWorker = {
        ...worker,
        availability: { ...worker.availability, activeTaskCount, state },
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('capacity.changed', {
        workerId,
        activeTaskCount,
        maxConcurrentTasks: updated.availability.maxConcurrentTasks,
        state,
      });
      return updated;
    },
  };
}
