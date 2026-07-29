/**
 * Real Organization Registry — the platform-level administrative
 * record of every organization (tenancy boundary) in Lateen OS,
 * guarded by a simple, deterministic status lifecycle.
 *
 * @module organizations/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { DuplicateOrganizationError, InvalidOrganizationTransitionError, OrganizationNotFoundError } from '../shared/errors.js';
import { nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationRepository } from './repository.js';
import type { Organization, OrganizationPlan, OrganizationStatus } from './types.js';

const ORGANIZATION_TRANSITIONS: Readonly<Record<OrganizationStatus, readonly OrganizationStatus[]>> = {
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
};

/** Whether an organization may transition from one status to another. */
export function canTransitionOrganization(from: OrganizationStatus, to: OrganizationStatus): boolean {
  return ORGANIZATION_TRANSITIONS[from].includes(to);
}

export interface RegisterOrganizationInput {
  readonly name: string;
  readonly plan?: OrganizationPlan;
}

export interface OrganizationEngine {
  registerOrganization(organizationId: OrganizationId, input: RegisterOrganizationInput): Promise<Organization>;
  suspendOrganization(organizationId: OrganizationId): Promise<Organization>;
  reactivateOrganization(organizationId: OrganizationId): Promise<Organization>;
  archiveOrganization(organizationId: OrganizationId): Promise<Organization>;
  getOrganization(organizationId: OrganizationId): Promise<Organization | null>;
  listOrganizations(): Promise<readonly Organization[]>;
}

/** Creates a real {@link OrganizationEngine}. */
export function createOrganizationEngine(repository: OrganizationRepository, eventBus?: AdminEventBus, now: () => string = nowIso): OrganizationEngine {
  async function requireOrganization(organizationId: OrganizationId): Promise<Organization> {
    const organization = await repository.findById(organizationId, organizationId);
    if (!organization) throw new OrganizationNotFoundError(organizationId);
    return organization;
  }

  async function transition(organizationId: OrganizationId, to: OrganizationStatus): Promise<Organization> {
    const organization = await requireOrganization(organizationId);
    if (!canTransitionOrganization(organization.status, to)) {
      throw new InvalidOrganizationTransitionError(organizationId, organization.status, to);
    }
    const updated: Organization = { ...organization, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async registerOrganization(organizationId, input) {
      const existing = await repository.findById(organizationId, organizationId);
      if (existing) throw new DuplicateOrganizationError(organizationId);
      const timestamp = now();
      const organization: Organization = {
        id: organizationId,
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        plan: input.plan ?? 'free',
        status: 'active',
      };
      await repository.save(organization);
      eventBus?.publish('organization.created', { organizationId, name: organization.name });
      return organization;
    },

    async suspendOrganization(organizationId) {
      return transition(organizationId, 'suspended');
    },

    async reactivateOrganization(organizationId) {
      return transition(organizationId, 'active');
    },

    async archiveOrganization(organizationId) {
      return transition(organizationId, 'archived');
    },

    async getOrganization(organizationId) {
      return repository.findById(organizationId, organizationId);
    },

    async listOrganizations() {
      return repository.findAll();
    },
  };
}
