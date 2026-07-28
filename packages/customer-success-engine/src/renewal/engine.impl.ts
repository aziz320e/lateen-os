/**
 * Real Renewals engine — pipeline, reminders, probability, and status
 * for customer contract/subscription renewals.
 *
 * @module renewal/engine.impl
 */
import type { CustomerSuccessEventBus } from '../events/customer-success-event-bus.js';
import { InvalidRenewalTransitionError, RenewalNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, RenewalId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';
import type { RenewalRepository } from './repository.js';
import type { Renewal, RenewalStatus } from './types.js';

const RENEWAL_TRANSITIONS: Readonly<Record<RenewalStatus, readonly RenewalStatus[]>> = {
  pipeline: ['reminder_sent', 'at_risk', 'won', 'lost'],
  reminder_sent: ['at_risk', 'won', 'lost'],
  at_risk: ['won', 'lost'],
  won: [],
  lost: [],
};

/** Whether a renewal may transition from one status to another. */
export function canTransitionRenewal(from: RenewalStatus, to: RenewalStatus): boolean {
  return RENEWAL_TRANSITIONS[from].includes(to);
}

export interface CreateRenewalInput {
  readonly customerId: string;
  readonly renewalDate: ISODate;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly probability?: number;
}

export interface SendReminderInput {
  readonly channel?: string;
}

export type RenewalOutcome = 'won' | 'lost';

export interface RenewalEngine {
  createRenewal(organizationId: OrganizationId, input: CreateRenewalInput): Promise<Renewal>;
  sendReminder(organizationId: OrganizationId, renewalId: RenewalId, input?: SendReminderInput): Promise<Renewal>;
  markAtRisk(organizationId: OrganizationId, renewalId: RenewalId): Promise<Renewal>;
  updateProbability(organizationId: OrganizationId, renewalId: RenewalId, probability: number): Promise<Renewal>;
  complete(organizationId: OrganizationId, renewalId: RenewalId, outcome: RenewalOutcome): Promise<Renewal>;
  get(organizationId: OrganizationId, renewalId: RenewalId): Promise<Renewal | null>;
  list(organizationId: OrganizationId): Promise<readonly Renewal[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly Renewal[]>;
  findByStatus(organizationId: OrganizationId, status: RenewalStatus): Promise<readonly Renewal[]>;
}

/** Creates a real {@link RenewalEngine}. */
export function createRenewalEngine(
  repository: RenewalRepository,
  eventBus?: CustomerSuccessEventBus,
  now: () => string = nowIso,
): RenewalEngine {
  async function requireRenewal(organizationId: OrganizationId, renewalId: RenewalId): Promise<Renewal> {
    const renewal = await repository.findById(organizationId, renewalId);
    if (!renewal) throw new RenewalNotFoundError(renewalId);
    return renewal;
  }

  async function transition(organizationId: OrganizationId, renewalId: RenewalId, to: RenewalStatus): Promise<Renewal> {
    const renewal = await requireRenewal(organizationId, renewalId);
    if (!canTransitionRenewal(renewal.status, to)) {
      throw new InvalidRenewalTransitionError(renewalId, renewal.status, to);
    }
    const updated: Renewal = { ...renewal, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async createRenewal(organizationId, input) {
      const timestamp = now();
      const renewal: Renewal = {
        id: generateId('renewal'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        renewalDate: input.renewalDate,
        amount: input.amount,
        currency: input.currency,
        probability: input.probability ?? 50,
        status: 'pipeline',
        reminders: [],
      };
      await repository.save(renewal);
      eventBus?.publish('renewal.created', { organizationId, renewalId: renewal.id, customerId: renewal.customerId, renewalDate: renewal.renewalDate });
      return renewal;
    },

    async sendReminder(organizationId, renewalId, input) {
      const renewal = await requireRenewal(organizationId, renewalId);
      const nextStatus: RenewalStatus = renewal.status === 'pipeline' ? 'reminder_sent' : renewal.status;
      if (nextStatus !== renewal.status && !canTransitionRenewal(renewal.status, nextStatus)) {
        throw new InvalidRenewalTransitionError(renewalId, renewal.status, nextStatus);
      }
      const updated: Renewal = {
        ...renewal,
        status: nextStatus,
        reminders: [...renewal.reminders, { sentAt: now(), channel: input?.channel }],
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async markAtRisk(organizationId, renewalId) {
      return transition(organizationId, renewalId, 'at_risk');
    },

    async updateProbability(organizationId, renewalId, probability) {
      const renewal = await requireRenewal(organizationId, renewalId);
      const updated: Renewal = { ...renewal, probability, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async complete(organizationId, renewalId, outcome) {
      const updated = await transition(organizationId, renewalId, outcome);
      eventBus?.publish('renewal.completed', { organizationId, renewalId, customerId: updated.customerId, outcome });
      return updated;
    },

    async get(organizationId, renewalId) {
      return repository.findById(organizationId, renewalId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return repository.findByCustomer(organizationId, customerId);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
