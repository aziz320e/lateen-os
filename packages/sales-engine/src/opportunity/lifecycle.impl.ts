/**
 * Real Sales Opportunity Lifecycle + deterministic Sales Pipeline —
 * `create / qualify / propose / negotiate / closeWon / closeLost / reopen
 * / archive`, built atop a guarded, deterministic pipeline stage machine
 * (`new → discovery → qualified → proposal → negotiation → verbal_commit
 * → won/lost`).
 *
 * @module opportunity/lifecycle.impl
 */
import type { SalesEventBus } from '../events/sales-event-bus.js';
import { InvalidSalesStageTransitionError, SalesOpportunityNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type {
  AccountId,
  ContactId,
  CustomerId,
  EmployeeId,
  OrganizationId,
  SalesOpportunityId,
} from '../shared/identifiers.js';
import type { CurrencyCode, ISODateTime, SalesTag } from '../shared/primitives.js';
import type { SalesOpportunityRepository } from './repository.js';
import type { SalesOpportunity, SalesPipelineStage } from './types.js';

const SALES_PIPELINE_TRANSITIONS: Readonly<Record<SalesPipelineStage, readonly SalesPipelineStage[]>> = {
  new: ['discovery', 'qualified', 'lost'],
  discovery: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['verbal_commit', 'won', 'lost'],
  verbal_commit: ['won', 'lost'],
  won: [],
  lost: [],
};

export function canTransitionSalesStage(from: SalesPipelineStage, to: SalesPipelineStage): boolean {
  return SALES_PIPELINE_TRANSITIONS[from].includes(to);
}

export interface CreateSalesOpportunityInput {
  readonly name: string;
  readonly customerId?: CustomerId;
  readonly contactId?: ContactId;
  readonly accountId?: AccountId;
  readonly ownerId?: EmployeeId;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly source?: string;
  readonly expectedCloseDate?: ISODateTime;
  readonly tags?: readonly SalesTag[];
}

export interface UpdateSalesOpportunityInput {
  readonly name?: string;
  readonly customerId?: CustomerId;
  readonly contactId?: ContactId;
  readonly accountId?: AccountId;
  readonly ownerId?: EmployeeId;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly source?: string;
  readonly expectedCloseDate?: ISODateTime;
  readonly tags?: readonly SalesTag[];
}

export interface SalesOpportunityLifecycle {
  create(organizationId: OrganizationId, input: CreateSalesOpportunityInput): Promise<SalesOpportunity>;
  update(organizationId: OrganizationId, opportunityId: SalesOpportunityId, patch: UpdateSalesOpportunityInput): Promise<SalesOpportunity>;
  /** Raw, guarded pipeline stage transition — the mechanism every named lifecycle action is built on. */
  advanceStage(organizationId: OrganizationId, opportunityId: SalesOpportunityId, toStage: SalesPipelineStage): Promise<SalesOpportunity>;
  qualify(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity>;
  propose(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity>;
  negotiate(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity>;
  closeWon(organizationId: OrganizationId, opportunityId: SalesOpportunityId, amount?: string): Promise<SalesOpportunity>;
  closeLost(organizationId: OrganizationId, opportunityId: SalesOpportunityId, reason?: string): Promise<SalesOpportunity>;
  /** Reopens a lost opportunity back to the stage it was lost from (or `negotiation` if none recorded). */
  reopen(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity>;
  archive(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity>;
  get(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity | null>;
}

/** Creates a real {@link SalesOpportunityLifecycle} backed by a {@link SalesOpportunityRepository}. */
export function createSalesOpportunityLifecycle(
  repository: SalesOpportunityRepository,
  eventBus?: SalesEventBus,
  now: () => string = nowIso,
): SalesOpportunityLifecycle {
  async function requireOpportunity(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity> {
    const opportunity = await repository.findById(organizationId, opportunityId);
    if (!opportunity) throw new SalesOpportunityNotFoundError(opportunityId);
    return opportunity;
  }

  async function advanceStage(
    organizationId: OrganizationId,
    opportunityId: SalesOpportunityId,
    toStage: SalesPipelineStage,
  ): Promise<SalesOpportunity> {
    const opportunity = await requireOpportunity(organizationId, opportunityId);
    if (opportunity.status !== 'active') {
      throw new InvalidSalesStageTransitionError(opportunityId, opportunity.stage, toStage);
    }
    if (!canTransitionSalesStage(opportunity.stage, toStage)) {
      throw new InvalidSalesStageTransitionError(opportunityId, opportunity.stage, toStage);
    }
    const isClosing = toStage === 'won' || toStage === 'lost';
    const updated: SalesOpportunity = {
      ...opportunity,
      stage: toStage,
      previousStage: isClosing ? opportunity.stage : opportunity.previousStage,
      closedAt: isClosing ? now() : opportunity.closedAt,
      updatedAt: now(),
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const opportunity: SalesOpportunity = {
        id: generateId('sales-opportunity'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        stage: 'new',
        status: 'active',
        customerId: input.customerId,
        contactId: input.contactId,
        accountId: input.accountId,
        ownerId: input.ownerId,
        amount: input.amount,
        currency: input.currency,
        source: input.source,
        expectedCloseDate: input.expectedCloseDate,
        tags: input.tags ?? [],
      };
      await repository.save(opportunity);
      eventBus?.publish('opportunity.created', { opportunityId: opportunity.id, organizationId, name: opportunity.name });
      return opportunity;
    },

    async update(organizationId, opportunityId, patch) {
      const opportunity = await requireOpportunity(organizationId, opportunityId);
      if (opportunity.status !== 'active') {
        throw new InvalidSalesStageTransitionError(opportunityId, opportunity.stage, 'updated');
      }
      const updated: SalesOpportunity = {
        ...opportunity,
        name: patch.name ?? opportunity.name,
        customerId: patch.customerId ?? opportunity.customerId,
        contactId: patch.contactId ?? opportunity.contactId,
        accountId: patch.accountId ?? opportunity.accountId,
        ownerId: patch.ownerId ?? opportunity.ownerId,
        amount: patch.amount ?? opportunity.amount,
        currency: patch.currency ?? opportunity.currency,
        source: patch.source ?? opportunity.source,
        expectedCloseDate: patch.expectedCloseDate ?? opportunity.expectedCloseDate,
        tags: patch.tags ?? opportunity.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    advanceStage,

    async qualify(organizationId, opportunityId) {
      const qualified = await advanceStage(organizationId, opportunityId, 'qualified');
      eventBus?.publish('opportunity.qualified', { opportunityId, organizationId });
      return qualified;
    },

    async propose(organizationId, opportunityId) {
      const proposed = await advanceStage(organizationId, opportunityId, 'proposal');
      eventBus?.publish('proposal.created', { opportunityId, organizationId });
      return proposed;
    },

    async negotiate(organizationId, opportunityId) {
      const negotiating = await advanceStage(organizationId, opportunityId, 'negotiation');
      eventBus?.publish('negotiation.started', { opportunityId, organizationId });
      return negotiating;
    },

    async closeWon(organizationId, opportunityId, amount) {
      const won = await advanceStage(organizationId, opportunityId, 'won');
      const updated = amount ? { ...won, amount } : won;
      if (amount) await repository.save(updated);
      eventBus?.publish('deal.won', { opportunityId, organizationId, amount: updated.amount });
      return updated;
    },

    async closeLost(organizationId, opportunityId, reason) {
      const lost = await advanceStage(organizationId, opportunityId, 'lost');
      const updated: SalesOpportunity = { ...lost, lostReason: reason };
      await repository.save(updated);
      eventBus?.publish('deal.lost', { opportunityId, organizationId, reason });
      return updated;
    },

    async reopen(organizationId, opportunityId) {
      const opportunity = await requireOpportunity(organizationId, opportunityId);
      if (opportunity.status !== 'active' || opportunity.stage !== 'lost') {
        throw new InvalidSalesStageTransitionError(opportunityId, opportunity.stage, opportunity.previousStage ?? 'negotiation');
      }
      const restoredStage = opportunity.previousStage ?? 'negotiation';
      const updated: SalesOpportunity = {
        ...opportunity,
        stage: restoredStage,
        previousStage: undefined,
        lostReason: undefined,
        closedAt: undefined,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, opportunityId) {
      const opportunity = await requireOpportunity(organizationId, opportunityId);
      if (opportunity.status === 'archived') {
        throw new InvalidSalesStageTransitionError(opportunityId, opportunity.status, 'archived');
      }
      const updated: SalesOpportunity = { ...opportunity, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, opportunityId) {
      return repository.findById(organizationId, opportunityId);
    },
  };
}
