/**
 * Real Expansion engine — upsell and cross-sell opportunities for
 * existing customers, guarded by a simple identified/proposed/won/lost
 * lifecycle.
 *
 * @module expansion/engine.impl
 */
import { ExpansionOpportunityNotFoundError, InvalidExpansionTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ExpansionOpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';
import type { ExpansionOpportunityRepository } from './repository.js';
import type { ExpansionOpportunity, ExpansionOpportunityStatus, ExpansionOpportunityType } from './types.js';

const EXPANSION_TRANSITIONS: Readonly<Record<ExpansionOpportunityStatus, readonly ExpansionOpportunityStatus[]>> = {
  identified: ['proposed', 'lost'],
  proposed: ['won', 'lost'],
  won: [],
  lost: [],
};

/** Whether an expansion opportunity may transition from one status to another. */
export function canTransitionExpansion(from: ExpansionOpportunityStatus, to: ExpansionOpportunityStatus): boolean {
  return EXPANSION_TRANSITIONS[from].includes(to);
}

export interface IdentifyExpansionOpportunityInput {
  readonly customerId: string;
  readonly opportunityType: ExpansionOpportunityType;
  readonly description?: string;
  readonly estimatedValue?: string;
  readonly currency?: CurrencyCode;
}

export interface ExpansionEngine {
  identify(organizationId: OrganizationId, input: IdentifyExpansionOpportunityInput): Promise<ExpansionOpportunity>;
  propose(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId): Promise<ExpansionOpportunity>;
  win(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId): Promise<ExpansionOpportunity>;
  lose(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId): Promise<ExpansionOpportunity>;
  linkSalesOpportunity(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId, salesOpportunityId: string): Promise<ExpansionOpportunity>;
  get(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId): Promise<ExpansionOpportunity | null>;
  list(organizationId: OrganizationId): Promise<readonly ExpansionOpportunity[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly ExpansionOpportunity[]>;
  findByType(organizationId: OrganizationId, opportunityType: ExpansionOpportunityType): Promise<readonly ExpansionOpportunity[]>;
  findByStatus(organizationId: OrganizationId, status: ExpansionOpportunityStatus): Promise<readonly ExpansionOpportunity[]>;
}

/** Creates a real {@link ExpansionEngine}. */
export function createExpansionEngine(repository: ExpansionOpportunityRepository, now: () => string = nowIso): ExpansionEngine {
  async function requireOpportunity(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId): Promise<ExpansionOpportunity> {
    const opportunity = await repository.findById(organizationId, opportunityId);
    if (!opportunity) throw new ExpansionOpportunityNotFoundError(opportunityId);
    return opportunity;
  }

  async function transition(organizationId: OrganizationId, opportunityId: ExpansionOpportunityId, to: ExpansionOpportunityStatus): Promise<ExpansionOpportunity> {
    const opportunity = await requireOpportunity(organizationId, opportunityId);
    if (!canTransitionExpansion(opportunity.status, to)) {
      throw new InvalidExpansionTransitionError(opportunityId, opportunity.status, to);
    }
    const updated: ExpansionOpportunity = { ...opportunity, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async identify(organizationId, input) {
      const timestamp = now();
      const opportunity: ExpansionOpportunity = {
        id: generateId('expansion-opportunity'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        opportunityType: input.opportunityType,
        description: input.description,
        estimatedValue: input.estimatedValue,
        currency: input.currency,
        status: 'identified',
      };
      await repository.save(opportunity);
      return opportunity;
    },

    async propose(organizationId, opportunityId) {
      return transition(organizationId, opportunityId, 'proposed');
    },

    async win(organizationId, opportunityId) {
      return transition(organizationId, opportunityId, 'won');
    },

    async lose(organizationId, opportunityId) {
      return transition(organizationId, opportunityId, 'lost');
    },

    async linkSalesOpportunity(organizationId, opportunityId, salesOpportunityId) {
      const opportunity = await requireOpportunity(organizationId, opportunityId);
      const updated: ExpansionOpportunity = { ...opportunity, linkedSalesOpportunityId: salesOpportunityId, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, opportunityId) {
      return repository.findById(organizationId, opportunityId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return repository.findByCustomer(organizationId, customerId);
    },

    async findByType(organizationId, opportunityType) {
      return repository.findByType(organizationId, opportunityType);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
