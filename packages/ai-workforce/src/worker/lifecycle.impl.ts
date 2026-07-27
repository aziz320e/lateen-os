/**
 * Real Worker Lifecycle — the AI Worker aggregate's guarded state machine.
 * Governs hire / activate / suspend / resume / retire transitions over
 * {@link WorkerStatus}.
 *
 * @module worker/lifecycle.impl
 */
import type { WorkforceEventBus } from '../events/workforce-event-bus.js';
import { InvalidWorkerTransitionError, WorkerNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AgentId, OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { WorkerRepository } from './repository.js';
import type {
  AIWorker,
  WorkerCapability,
  WorkerId,
  WorkerLifecycle as WorkerLifecycleStage,
  WorkerProfile,
  WorkerRole,
  WorkerSkill,
  WorkerStatus,
} from './types.js';
import type { ToolAccessGrant, WorkerCertification } from '../skills/types.js';

const WORKER_TRANSITIONS: Readonly<Record<WorkerStatus, readonly WorkerStatus[]>> = {
  draft: ['onboarding', 'offboarded'],
  onboarding: ['active', 'offboarded'],
  active: ['busy', 'away', 'paused', 'suspended', 'offboarded'],
  busy: ['active', 'away', 'paused', 'suspended', 'offboarded'],
  away: ['active', 'busy', 'paused', 'suspended', 'offboarded'],
  paused: ['active', 'suspended', 'offboarded'],
  suspended: ['active', 'offboarded'],
  offboarded: ['archived'],
  archived: [],
};

const STATUS_TO_LIFECYCLE_STAGE: Readonly<Record<WorkerStatus, WorkerLifecycleStage>> = {
  draft: 'registered',
  onboarding: 'provisioned',
  active: 'activated',
  busy: 'assigned',
  away: 'activated',
  paused: 'paused',
  suspended: 'suspended',
  offboarded: 'offboarded',
  archived: 'offboarded',
};

export function canTransitionWorker(from: WorkerStatus, to: WorkerStatus): boolean {
  return WORKER_TRANSITIONS[from].includes(to);
}

export interface HireWorkerInput {
  readonly organizationId: OrganizationId;
  readonly businessDnaAgentId: AgentId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly profile: WorkerProfile;
  readonly roles?: readonly WorkerRole[];
  readonly capabilities?: readonly WorkerCapability[];
  readonly skills?: readonly WorkerSkill[];
  readonly certifications?: readonly WorkerCertification[];
  readonly toolAccess?: readonly ToolAccessGrant[];
  readonly maxConcurrentTasks?: number;
}

export interface WorkerLifecycleService {
  hire(input: HireWorkerInput): Promise<AIWorker>;
  activate(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker>;
  suspend(organizationId: OrganizationId, workerId: WorkerId, reason?: string): Promise<AIWorker>;
  resume(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker>;
  retire(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker>;
  transition(organizationId: OrganizationId, workerId: WorkerId, to: WorkerStatus): Promise<AIWorker>;
  get(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker | null>;
}

/** Creates a real {@link WorkerLifecycleService} backed by a {@link WorkerRepository}. */
export function createWorkerLifecycle(
  repository: WorkerRepository,
  eventBus?: WorkforceEventBus,
  now: () => string = nowIso,
): WorkerLifecycleService {
  async function requireWorker(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker> {
    const worker = await repository.findById(organizationId, workerId);
    if (!worker) throw new WorkerNotFoundError(workerId);
    return worker;
  }

  async function transition(organizationId: OrganizationId, workerId: WorkerId, to: WorkerStatus): Promise<AIWorker> {
    const worker = await requireWorker(organizationId, workerId);
    if (!canTransitionWorker(worker.status, to)) {
      throw new InvalidWorkerTransitionError(workerId, worker.status, to);
    }
    const updated: AIWorker = {
      ...worker,
      status: to,
      lifecycle: STATUS_TO_LIFECYCLE_STAGE[to],
      updatedAt: now(),
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async hire(input) {
      const workerId = generateId('worker');
      const timestamp = now();
      const worker: AIWorker = {
        id: workerId,
        organizationId: input.organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        businessDnaAgentId: input.businessDnaAgentId,
        runtimeAgentId: input.runtimeAgentId,
        profile: input.profile,
        roles: input.roles ?? [],
        capabilities: input.capabilities ?? [],
        skills: input.skills ?? [],
        certifications: input.certifications ?? [],
        toolAccess: input.toolAccess ?? [],
        availability: {
          state: 'unavailable',
          effectiveFrom: timestamp,
          maxConcurrentTasks: input.maxConcurrentTasks ?? 1,
          activeTaskCount: 0,
        },
        status: 'draft',
        lifecycle: 'registered',
      };
      await repository.save(worker);
      eventBus?.publish('worker.hired', {
        workerId: worker.id,
        organizationId: worker.organizationId,
        workforceType: worker.profile.workforceType,
      });
      return worker;
    },

    async activate(organizationId, workerId) {
      const worker = await requireWorker(organizationId, workerId);
      if (worker.status !== 'draft' && worker.status !== 'onboarding') {
        throw new InvalidWorkerTransitionError(workerId, worker.status, 'active');
      }
      if (worker.status === 'draft') {
        await transition(organizationId, workerId, 'onboarding');
      }
      const activated = await transition(organizationId, workerId, 'active');
      const withAvailability: AIWorker = {
        ...activated,
        availability: { ...activated.availability, state: 'available' },
      };
      await repository.save(withAvailability);
      eventBus?.publish('worker.activated', { workerId, organizationId });
      return withAvailability;
    },

    async suspend(organizationId, workerId, reason) {
      const worker = await requireWorker(organizationId, workerId);
      if (!['active', 'busy', 'away', 'paused'].includes(worker.status)) {
        throw new InvalidWorkerTransitionError(workerId, worker.status, 'suspended');
      }
      const suspended = await transition(organizationId, workerId, 'suspended');
      const withAvailability: AIWorker = {
        ...suspended,
        availability: { ...suspended.availability, state: 'unavailable' },
      };
      await repository.save(withAvailability);
      eventBus?.publish('worker.suspended', { workerId, organizationId, reason });
      return withAvailability;
    },

    async resume(organizationId, workerId) {
      const worker = await requireWorker(organizationId, workerId);
      if (worker.status !== 'suspended' && worker.status !== 'paused') {
        throw new InvalidWorkerTransitionError(workerId, worker.status, 'active');
      }
      const resumed = await transition(organizationId, workerId, 'active');
      const withAvailability: AIWorker = {
        ...resumed,
        availability: { ...resumed.availability, state: 'available' },
      };
      await repository.save(withAvailability);
      eventBus?.publish('worker.resumed', { workerId, organizationId });
      return withAvailability;
    },

    async retire(organizationId, workerId) {
      const worker = await requireWorker(organizationId, workerId);
      if (worker.status === 'offboarded' || worker.status === 'archived') {
        throw new InvalidWorkerTransitionError(workerId, worker.status, 'offboarded');
      }
      const retired = await transition(organizationId, workerId, 'offboarded');
      const withAvailability: AIWorker = {
        ...retired,
        availability: { ...retired.availability, state: 'unavailable' },
      };
      await repository.save(withAvailability);
      eventBus?.publish('worker.retired', { workerId, organizationId });
      return withAvailability;
    },

    transition,

    async get(organizationId, workerId) {
      return repository.findById(organizationId, workerId);
    },
  };
}
