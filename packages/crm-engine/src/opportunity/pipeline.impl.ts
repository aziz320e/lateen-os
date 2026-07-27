/**
 * Real Opportunity Management + Deal Pipeline — create / update, plus a
 * guarded, deterministic pipeline state machine
 * (`new → qualified → proposal → negotiation → won/lost`).
 *
 * @module opportunity/pipeline.impl
 */
import type { CrmEventBus } from '../events/crm-event-bus.js';
import { InvalidDealStageTransitionError, OpportunityNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AccountId, ContactId, CustomerId, OpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, CurrencyCode, ISODateTime } from '../shared/primitives.js';
import type { OpportunityRepository } from './repository.js';
import type { DealStage, Opportunity } from './types.js';

const DEAL_STAGE_TRANSITIONS: Readonly<Record<DealStage, readonly DealStage[]>> = {
  new: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: [],
};

export function canTransitionDealStage(from: DealStage, to: DealStage): boolean {
  return DEAL_STAGE_TRANSITIONS[from].includes(to);
}

export interface CreateOpportunityInput {
  readonly name: string;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly accountId?: AccountId;
  readonly customerId?: CustomerId;
  readonly contactId?: ContactId;
  readonly expectedCloseDate?: ISODateTime;
  readonly probability?: string;
  readonly tags?: readonly CrmTag[];
}

export interface UpdateOpportunityInput {
  readonly name?: string;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly accountId?: AccountId;
  readonly customerId?: CustomerId;
  readonly contactId?: ContactId;
  readonly expectedCloseDate?: ISODateTime;
  readonly probability?: string;
  readonly tags?: readonly CrmTag[];
}

export interface OpportunityPipeline {
  create(organizationId: OrganizationId, input: CreateOpportunityInput): Promise<Opportunity>;
  update(organizationId: OrganizationId, opportunityId: OpportunityId, patch: UpdateOpportunityInput): Promise<Opportunity>;
  advanceStage(organizationId: OrganizationId, opportunityId: OpportunityId, toStage: DealStage): Promise<Opportunity>;
  win(organizationId: OrganizationId, opportunityId: OpportunityId, amount?: string): Promise<Opportunity>;
  lose(organizationId: OrganizationId, opportunityId: OpportunityId, reason?: string): Promise<Opportunity>;
  get(organizationId: OrganizationId, opportunityId: OpportunityId): Promise<Opportunity | null>;
}

/** Creates a real {@link OpportunityPipeline} backed by an {@link OpportunityRepository}. */
export function createOpportunityPipeline(
  repository: OpportunityRepository,
  eventBus?: CrmEventBus,
  now: () => string = nowIso,
): OpportunityPipeline {
  async function requireOpportunity(organizationId: OrganizationId, opportunityId: OpportunityId): Promise<Opportunity> {
    const opportunity = await repository.findById(organizationId, opportunityId);
    if (!opportunity) throw new OpportunityNotFoundError(opportunityId);
    return opportunity;
  }

  async function advanceStage(organizationId: OrganizationId, opportunityId: OpportunityId, toStage: DealStage): Promise<Opportunity> {
    const opportunity = await requireOpportunity(organizationId, opportunityId);
    if (!canTransitionDealStage(opportunity.stage, toStage)) {
      throw new InvalidDealStageTransitionError(opportunityId, opportunity.stage, toStage);
    }
    const isClosing = toStage === 'won' || toStage === 'lost';
    const updated: Opportunity = {
      ...opportunity,
      stage: toStage,
      closedAt: isClosing ? now() : opportunity.closedAt,
      updatedAt: now(),
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const opportunity: Opportunity = {
        id: generateId('opportunity'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        stage: 'new',
        amount: input.amount,
        currency: input.currency,
        accountId: input.accountId,
        customerId: input.customerId,
        contactId: input.contactId,
        expectedCloseDate: input.expectedCloseDate,
        probability: input.probability,
        tags: input.tags ?? [],
      };
      await repository.save(opportunity);
      eventBus?.publish('opportunity.created', { opportunityId: opportunity.id, organizationId, name: opportunity.name, stage: opportunity.stage });
      return opportunity;
    },

    async update(organizationId, opportunityId, patch) {
      const opportunity = await requireOpportunity(organizationId, opportunityId);
      if (opportunity.stage === 'won' || opportunity.stage === 'lost') {
        throw new InvalidDealStageTransitionError(opportunityId, opportunity.stage, 'updated');
      }
      const updated: Opportunity = {
        ...opportunity,
        name: patch.name ?? opportunity.name,
        amount: patch.amount ?? opportunity.amount,
        currency: patch.currency ?? opportunity.currency,
        accountId: patch.accountId ?? opportunity.accountId,
        customerId: patch.customerId ?? opportunity.customerId,
        contactId: patch.contactId ?? opportunity.contactId,
        expectedCloseDate: patch.expectedCloseDate ?? opportunity.expectedCloseDate,
        probability: patch.probability ?? opportunity.probability,
        tags: patch.tags ?? opportunity.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    advanceStage,

    async win(organizationId, opportunityId, amount) {
      const won = await advanceStage(organizationId, opportunityId, 'won');
      const updated = amount ? { ...won, amount } : won;
      if (amount) await repository.save(updated);
      eventBus?.publish('opportunity.won', { opportunityId, organizationId, amount: updated.amount });
      return updated;
    },

    async lose(organizationId, opportunityId, reason) {
      const lost = await advanceStage(organizationId, opportunityId, 'lost');
      const updated: Opportunity = { ...lost, lostReason: reason };
      await repository.save(updated);
      eventBus?.publish('opportunity.lost', { opportunityId, organizationId, reason });
      return updated;
    },

    async get(organizationId, opportunityId) {
      return repository.findById(organizationId, opportunityId);
    },
  };
}
