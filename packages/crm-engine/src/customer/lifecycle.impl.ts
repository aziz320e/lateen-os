/**
 * Real Customer Lifecycle — create / update / archive / restore, plus
 * deterministic duplicate merging.
 *
 * @module customer/lifecycle.impl
 */
import type { CrmEventBus } from '../events/crm-event-bus.js';
import { CustomerNotFoundError, InvalidCustomerTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AccountId, CustomerId, LeadId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, Email, Phone } from '../shared/primitives.js';
import type { CustomerRepository } from './repository.js';
import type { Customer, CustomerStatus } from './types.js';

const CUSTOMER_TRANSITIONS: Readonly<Record<CustomerStatus, readonly CustomerStatus[]>> = {
  active: ['archived', 'merged'],
  archived: ['active', 'merged'],
  merged: [],
};

export function canTransitionCustomer(from: CustomerStatus, to: CustomerStatus): boolean {
  return CUSTOMER_TRANSITIONS[from].includes(to);
}

export interface CreateCustomerInput {
  readonly name: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly company?: string;
  readonly accountId?: AccountId;
  readonly tags?: readonly CrmTag[];
  readonly sourceLeadId?: LeadId;
}

export interface UpdateCustomerInput {
  readonly name?: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly company?: string;
  readonly accountId?: AccountId;
  readonly tags?: readonly CrmTag[];
}

export interface MergeCustomersResult {
  readonly primary: Customer;
  readonly merged: readonly Customer[];
}

export interface CustomerLifecycle {
  create(organizationId: OrganizationId, input: CreateCustomerInput): Promise<Customer>;
  update(organizationId: OrganizationId, customerId: CustomerId, patch: UpdateCustomerInput): Promise<Customer>;
  archive(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer>;
  restore(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer>;
  /** Merges each duplicate's missing fields/tags into the primary, then marks duplicates `'merged'`. */
  mergeDuplicates(
    organizationId: OrganizationId,
    primaryCustomerId: CustomerId,
    duplicateCustomerIds: readonly CustomerId[],
  ): Promise<MergeCustomersResult>;
  transition(organizationId: OrganizationId, customerId: CustomerId, to: CustomerStatus): Promise<Customer>;
  get(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer | null>;
}

/** Creates a real {@link CustomerLifecycle} backed by a {@link CustomerRepository}. */
export function createCustomerLifecycle(
  repository: CustomerRepository,
  eventBus?: CrmEventBus,
  now: () => string = nowIso,
): CustomerLifecycle {
  async function requireCustomer(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer> {
    const customer = await repository.findById(organizationId, customerId);
    if (!customer) throw new CustomerNotFoundError(customerId);
    return customer;
  }

  async function transition(organizationId: OrganizationId, customerId: CustomerId, to: CustomerStatus): Promise<Customer> {
    const customer = await requireCustomer(organizationId, customerId);
    if (!canTransitionCustomer(customer.status, to)) {
      throw new InvalidCustomerTransitionError(customerId, customer.status, to);
    }
    const updated: Customer = { ...customer, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const customer: Customer = {
        id: generateId('customer'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        accountId: input.accountId,
        status: 'active',
        tags: input.tags ?? [],
        sourceLeadId: input.sourceLeadId,
      };
      await repository.save(customer);
      eventBus?.publish('customer.created', { customerId: customer.id, organizationId, name: customer.name });
      return customer;
    },

    async update(organizationId, customerId, patch) {
      const customer = await requireCustomer(organizationId, customerId);
      if (customer.status !== 'active') {
        throw new InvalidCustomerTransitionError(customerId, customer.status, 'updated');
      }
      const updated: Customer = {
        ...customer,
        name: patch.name ?? customer.name,
        email: patch.email ?? customer.email,
        phone: patch.phone ?? customer.phone,
        company: patch.company ?? customer.company,
        accountId: patch.accountId ?? customer.accountId,
        tags: patch.tags ?? customer.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('customer.updated', { customerId, organizationId });
      return updated;
    },

    async archive(organizationId, customerId) {
      return transition(organizationId, customerId, 'archived');
    },

    async restore(organizationId, customerId) {
      return transition(organizationId, customerId, 'active');
    },

    async mergeDuplicates(organizationId, primaryCustomerId, duplicateCustomerIds) {
      let primary = await requireCustomer(organizationId, primaryCustomerId);
      if (primary.status === 'merged') {
        throw new InvalidCustomerTransitionError(primaryCustomerId, primary.status, 'merged');
      }

      const merged: Customer[] = [];
      const tagSet = new Set(primary.tags);

      for (const duplicateId of duplicateCustomerIds) {
        if (duplicateId === primaryCustomerId) continue;
        const duplicate = await requireCustomer(organizationId, duplicateId);
        if (duplicate.status === 'merged') {
          throw new InvalidCustomerTransitionError(duplicateId, duplicate.status, 'merged');
        }

        primary = {
          ...primary,
          email: primary.email ?? duplicate.email,
          phone: primary.phone ?? duplicate.phone,
          company: primary.company ?? duplicate.company,
          accountId: primary.accountId ?? duplicate.accountId,
        };
        for (const tag of duplicate.tags) tagSet.add(tag);

        const updatedDuplicate: Customer = {
          ...duplicate,
          status: 'merged',
          mergedIntoCustomerId: primaryCustomerId,
          updatedAt: now(),
        };
        await repository.save(updatedDuplicate);
        merged.push(updatedDuplicate);
      }

      const updatedPrimary: Customer = { ...primary, tags: [...tagSet], updatedAt: now() };
      await repository.save(updatedPrimary);
      if (merged.length > 0) {
        eventBus?.publish('customer.updated', { customerId: primaryCustomerId, organizationId });
      }
      return { primary: updatedPrimary, merged };
    },

    transition,

    async get(organizationId, customerId) {
      return repository.findById(organizationId, customerId);
    },
  };
}
