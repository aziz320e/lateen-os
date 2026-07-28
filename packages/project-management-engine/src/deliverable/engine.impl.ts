/**
 * Real Deliverables engine — a guarded
 * draft/in_review/accepted/rejected/completed lifecycle with acceptance
 * approvals and completion tracking.
 *
 * @module deliverable/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import type { ProjectEventBus } from '../events/project-event-bus.js';
import { DeliverableNotFoundError, InvalidDeliverableTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DeliverableId, OrganizationId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';
import type { DeliverableRepository } from './repository.js';
import type { Deliverable, DeliverableApproval, DeliverableStatus } from './types.js';

const DELIVERABLE_TRANSITIONS: Readonly<Record<DeliverableStatus, readonly DeliverableStatus[]>> = {
  draft: ['in_review'],
  in_review: ['accepted', 'rejected'],
  accepted: ['completed'],
  rejected: ['draft'],
  completed: [],
};

/** Whether a deliverable may transition from one status to another. */
export function canTransitionDeliverable(from: DeliverableStatus, to: DeliverableStatus): boolean {
  return DELIVERABLE_TRANSITIONS[from].includes(to);
}

export interface CreateDeliverableInput {
  readonly projectId: ProjectId;
  readonly taskId?: ProjectTaskId;
  readonly name: string;
  readonly description?: string;
  readonly dueDate?: ISODate;
}

export interface UpdateDeliverableInput {
  readonly name?: string;
  readonly description?: string;
  readonly dueDate?: ISODate;
}

export interface ApproveDeliverableInput {
  readonly approverId: string;
  readonly comment?: string;
}

export interface DeliverableEngine {
  create(organizationId: OrganizationId, input: CreateDeliverableInput): Promise<Deliverable>;
  update(organizationId: OrganizationId, deliverableId: DeliverableId, input: UpdateDeliverableInput): Promise<Deliverable>;
  submitForReview(organizationId: OrganizationId, deliverableId: DeliverableId): Promise<Deliverable>;
  approve(organizationId: OrganizationId, deliverableId: DeliverableId, input: ApproveDeliverableInput): Promise<Deliverable>;
  reject(organizationId: OrganizationId, deliverableId: DeliverableId): Promise<Deliverable>;
  /** Returns a rejected deliverable to `draft` so it can be revised and resubmitted via `submitForReview()`. */
  resubmit(organizationId: OrganizationId, deliverableId: DeliverableId): Promise<Deliverable>;
  complete(organizationId: OrganizationId, deliverableId: DeliverableId): Promise<Deliverable>;
  get(organizationId: OrganizationId, deliverableId: DeliverableId): Promise<Deliverable | null>;
  list(organizationId: OrganizationId): Promise<readonly Deliverable[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Deliverable[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly Deliverable[]>;
  findByStatus(organizationId: OrganizationId, status: DeliverableStatus): Promise<readonly Deliverable[]>;
}

/** Creates a real {@link DeliverableEngine}. */
export function createDeliverableEngine(
  repository: DeliverableRepository,
  eventBus?: ProjectEventBus,
  now: () => string = nowIso,
): DeliverableEngine {
  async function requireDeliverable(organizationId: OrganizationId, deliverableId: DeliverableId): Promise<Deliverable> {
    const deliverable = await repository.findById(organizationId, deliverableId);
    if (!deliverable) throw new DeliverableNotFoundError(deliverableId);
    return deliverable;
  }

  async function transition(organizationId: OrganizationId, deliverableId: DeliverableId, to: DeliverableStatus): Promise<Deliverable> {
    const deliverable = await requireDeliverable(organizationId, deliverableId);
    if (!canTransitionDeliverable(deliverable.status, to)) {
      throw new InvalidDeliverableTransitionError(deliverableId, deliverable.status, to);
    }
    const updated: Deliverable = { ...deliverable, status: to, currentVersion: deliverable.currentVersion + 1, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const deliverable: Deliverable = {
        id: generateId('deliverable'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        taskId: input.taskId,
        name: input.name,
        description: input.description,
        dueDate: input.dueDate,
        approvals: [],
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(deliverable);
      return deliverable;
    },

    async update(organizationId, deliverableId, input) {
      const deliverable = await requireDeliverable(organizationId, deliverableId);
      const updated: Deliverable = {
        ...deliverable,
        name: input.name ?? deliverable.name,
        description: input.description ?? deliverable.description,
        dueDate: input.dueDate ?? deliverable.dueDate,
        currentVersion: deliverable.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async submitForReview(organizationId, deliverableId) {
      return transition(organizationId, deliverableId, 'in_review');
    },

    async approve(organizationId, deliverableId, input) {
      const deliverable = await requireDeliverable(organizationId, deliverableId);
      if (!canTransitionDeliverable(deliverable.status, 'accepted')) {
        throw new InvalidDeliverableTransitionError(deliverableId, deliverable.status, 'accepted');
      }
      const approval: DeliverableApproval = { approverId: input.approverId, approvedAt: now(), comment: input.comment };
      const updated: Deliverable = {
        ...deliverable,
        status: 'accepted',
        approvals: [...deliverable.approvals, approval],
        currentVersion: deliverable.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('deliverable.accepted', { organizationId, deliverableId: updated.id, projectId: updated.projectId });
      return updated;
    },

    async reject(organizationId, deliverableId) {
      return transition(organizationId, deliverableId, 'rejected');
    },

    async resubmit(organizationId, deliverableId) {
      return transition(organizationId, deliverableId, 'draft');
    },

    async complete(organizationId, deliverableId) {
      return transition(organizationId, deliverableId, 'completed');
    },

    async get(organizationId, deliverableId) {
      return repository.findById(organizationId, deliverableId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async findByTask(organizationId, taskId) {
      return repository.findByTask(organizationId, taskId);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
