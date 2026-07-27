/**
 * Real Remediation Engine — create, assign owner, due dates, and a
 * guarded status lifecycle (open → in_progress → blocked → completed
 * / cancelled).
 *
 * @module remediation/service.impl
 */
import type { ComplianceEventBus } from '../events/compliance-event-bus.js';
import { InvalidRemediationTransitionError, RemediationNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceFrameworkId, OrganizationId, RemediationId } from '../shared/identifiers.js';
import type { RemediationRepository } from './repository.js';
import type { Remediation, RemediationGapType, RemediationStatus } from './types.js';

const REMEDIATION_TRANSITIONS: Readonly<Record<RemediationStatus, readonly RemediationStatus[]>> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['blocked', 'completed', 'cancelled'],
  blocked: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Whether a remediation may transition from one status to another. */
export function canTransitionRemediation(from: RemediationStatus, to: RemediationStatus): boolean {
  return REMEDIATION_TRANSITIONS[from].includes(to);
}

export interface CreateRemediationInput {
  readonly title: string;
  readonly description?: string;
  readonly gapType?: RemediationGapType;
  readonly frameworkId?: ComplianceFrameworkId;
  readonly referenceId?: string;
  readonly ownerId?: string;
  readonly dueDate?: string;
}

export interface RemediationEngine {
  createRemediation(organizationId: OrganizationId, input: CreateRemediationInput): Promise<Remediation>;
  assignOwner(organizationId: OrganizationId, remediationId: RemediationId, ownerId: string): Promise<Remediation>;
  setDueDate(organizationId: OrganizationId, remediationId: RemediationId, dueDate: string): Promise<Remediation>;
  updateStatus(organizationId: OrganizationId, remediationId: RemediationId, status: RemediationStatus): Promise<Remediation>;
  complete(organizationId: OrganizationId, remediationId: RemediationId): Promise<Remediation>;
  cancel(organizationId: OrganizationId, remediationId: RemediationId): Promise<Remediation>;
  get(organizationId: OrganizationId, remediationId: RemediationId): Promise<Remediation | null>;
}

/** Creates a real {@link RemediationEngine} backed by a {@link RemediationRepository}. */
export function createRemediationEngine(
  repository: RemediationRepository,
  eventBus?: ComplianceEventBus,
  now: () => string = nowIso,
): RemediationEngine {
  async function requireRemediation(organizationId: OrganizationId, remediationId: RemediationId): Promise<Remediation> {
    const remediation = await repository.findById(organizationId, remediationId);
    if (!remediation) throw new RemediationNotFoundError(remediationId);
    return remediation;
  }

  async function transition(organizationId: OrganizationId, remediationId: RemediationId, to: RemediationStatus): Promise<Remediation> {
    const remediation = await requireRemediation(organizationId, remediationId);
    if (!canTransitionRemediation(remediation.status, to)) {
      throw new InvalidRemediationTransitionError(remediationId, remediation.status, to);
    }
    const updated: Remediation = {
      ...remediation,
      status: to,
      completedAt: to === 'completed' ? now() : remediation.completedAt,
      updatedAt: now(),
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async createRemediation(organizationId, input) {
      const timestamp = now();
      const remediation: Remediation = {
        id: generateId('remediation'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        description: input.description,
        gapType: input.gapType ?? 'manual',
        frameworkId: input.frameworkId,
        referenceId: input.referenceId,
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        status: 'open',
      };
      await repository.save(remediation);
      eventBus?.publish('remediation.created', { organizationId, remediationId: remediation.id });
      return remediation;
    },

    async assignOwner(organizationId, remediationId, ownerId) {
      const remediation = await requireRemediation(organizationId, remediationId);
      const updated: Remediation = { ...remediation, ownerId, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async setDueDate(organizationId, remediationId, dueDate) {
      const remediation = await requireRemediation(organizationId, remediationId);
      const updated: Remediation = { ...remediation, dueDate, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    updateStatus: (organizationId, remediationId, status) => transition(organizationId, remediationId, status),

    async complete(organizationId, remediationId) {
      const updated = await transition(organizationId, remediationId, 'completed');
      eventBus?.publish('remediation.completed', { organizationId, remediationId });
      return updated;
    },

    async cancel(organizationId, remediationId) {
      return transition(organizationId, remediationId, 'cancelled');
    },

    async get(organizationId, remediationId) {
      return repository.findById(organizationId, remediationId);
    },
  };
}
