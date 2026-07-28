/**
 * Real Customer Lifecycle engine — one record per real CRM Engine
 * customer, guarded by an
 * onboarding/activation/adoption/expansion/renewal/churn/reactivation
 * lifecycle.
 *
 * @module customer/engine.impl
 */
import type { CustomerSuccessEventBus } from '../events/customer-success-event-bus.js';
import { CustomerSuccessRecordNotFoundError, DuplicateCustomerSuccessRecordError, InvalidCustomerSuccessTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CustomerSuccessRecordId, OrganizationId } from '../shared/identifiers.js';
import type { CustomerSuccessRecordRepository } from './repository.js';
import type { CustomerSuccessRecord, CustomerSuccessStatus } from './types.js';

const CUSTOMER_SUCCESS_TRANSITIONS: Readonly<Record<CustomerSuccessStatus, readonly CustomerSuccessStatus[]>> = {
  onboarding: ['activation', 'churn'],
  activation: ['adoption', 'churn'],
  adoption: ['expansion', 'renewal', 'churn'],
  expansion: ['renewal', 'churn'],
  renewal: ['adoption', 'expansion', 'churn'],
  churn: ['reactivation'],
  reactivation: ['onboarding', 'activation'],
};

/** Whether a customer success record may transition from one status to another. */
export function canTransitionCustomerSuccess(from: CustomerSuccessStatus, to: CustomerSuccessStatus): boolean {
  return CUSTOMER_SUCCESS_TRANSITIONS[from].includes(to);
}

export interface OnboardCustomerInput {
  readonly customerId: string;
  readonly ownerId?: string;
}

export interface CustomerLifecycleEngine {
  onboard(organizationId: OrganizationId, input: OnboardCustomerInput): Promise<CustomerSuccessRecord>;
  activate(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  progressToAdoption(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  expand(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  renew(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  churn(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  reactivate(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  /** Returns a reactivated customer to `onboarding`, for a full re-onboarding journey. */
  restartOnboarding(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord>;
  get(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord | null>;
  list(organizationId: OrganizationId): Promise<readonly CustomerSuccessRecord[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<CustomerSuccessRecord | null>;
  findByStatus(organizationId: OrganizationId, status: CustomerSuccessStatus): Promise<readonly CustomerSuccessRecord[]>;
}

/** Creates a real {@link CustomerLifecycleEngine}. */
export function createCustomerLifecycleEngine(
  repository: CustomerSuccessRecordRepository,
  eventBus?: CustomerSuccessEventBus,
  now: () => string = nowIso,
): CustomerLifecycleEngine {
  async function requireRecord(organizationId: OrganizationId, recordId: CustomerSuccessRecordId): Promise<CustomerSuccessRecord> {
    const record = await repository.findById(organizationId, recordId);
    if (!record) throw new CustomerSuccessRecordNotFoundError(recordId);
    return record;
  }

  async function transition(organizationId: OrganizationId, recordId: CustomerSuccessRecordId, to: CustomerSuccessStatus): Promise<CustomerSuccessRecord> {
    const record = await requireRecord(organizationId, recordId);
    if (!canTransitionCustomerSuccess(record.status, to)) {
      throw new InvalidCustomerSuccessTransitionError(recordId, record.status, to);
    }
    const updated: CustomerSuccessRecord = { ...record, status: to, currentVersion: record.currentVersion + 1, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async onboard(organizationId, input) {
      const existing = await repository.findByCustomer(organizationId, input.customerId);
      if (existing) throw new DuplicateCustomerSuccessRecordError(input.customerId);

      const timestamp = now();
      const record: CustomerSuccessRecord = {
        id: generateId('customer-success-record'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        ownerId: input.ownerId,
        status: 'onboarding',
        currentVersion: 1,
      };
      await repository.save(record);
      eventBus?.publish('customer.onboarded', { organizationId, customerSuccessRecordId: record.id, customerId: record.customerId });
      return record;
    },

    async activate(organizationId, recordId) {
      const updated = await transition(organizationId, recordId, 'activation');
      eventBus?.publish('customer.activated', { organizationId, customerSuccessRecordId: recordId, customerId: updated.customerId });
      return updated;
    },

    async progressToAdoption(organizationId, recordId) {
      return transition(organizationId, recordId, 'adoption');
    },

    async expand(organizationId, recordId) {
      return transition(organizationId, recordId, 'expansion');
    },

    async renew(organizationId, recordId) {
      return transition(organizationId, recordId, 'renewal');
    },

    async churn(organizationId, recordId) {
      const updated = await transition(organizationId, recordId, 'churn');
      eventBus?.publish('customer.churned', { organizationId, customerSuccessRecordId: recordId, customerId: updated.customerId });
      return updated;
    },

    async reactivate(organizationId, recordId) {
      const updated = await transition(organizationId, recordId, 'reactivation');
      eventBus?.publish('customer.reactivated', { organizationId, customerSuccessRecordId: recordId, customerId: updated.customerId });
      return updated;
    },

    async restartOnboarding(organizationId, recordId) {
      return transition(organizationId, recordId, 'onboarding');
    },

    async get(organizationId, recordId) {
      return repository.findById(organizationId, recordId);
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
