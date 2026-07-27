/**
 * Real Contact Management — create / update / archive / restore.
 *
 * @module contact/service.impl
 */
import { ContactNotFoundError, InvalidRecordTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AccountId, ContactId, CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, Email, Phone } from '../shared/primitives.js';
import type { ContactRepository } from './repository.js';
import type { Contact, ContactStatus } from './types.js';

const CONTACT_TRANSITIONS: Readonly<Record<ContactStatus, readonly ContactStatus[]>> = {
  active: ['archived'],
  archived: ['active'],
};

export function canTransitionContact(from: ContactStatus, to: ContactStatus): boolean {
  return CONTACT_TRANSITIONS[from].includes(to);
}

export interface CreateContactInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly title?: string;
  readonly customerId?: CustomerId;
  readonly accountId?: AccountId;
  readonly tags?: readonly CrmTag[];
}

export interface UpdateContactInput {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly title?: string;
  readonly customerId?: CustomerId;
  readonly accountId?: AccountId;
  readonly tags?: readonly CrmTag[];
}

export interface ContactManagement {
  create(organizationId: OrganizationId, input: CreateContactInput): Promise<Contact>;
  update(organizationId: OrganizationId, contactId: ContactId, patch: UpdateContactInput): Promise<Contact>;
  archive(organizationId: OrganizationId, contactId: ContactId): Promise<Contact>;
  restore(organizationId: OrganizationId, contactId: ContactId): Promise<Contact>;
  get(organizationId: OrganizationId, contactId: ContactId): Promise<Contact | null>;
}

/** Creates a real {@link ContactManagement} service backed by a {@link ContactRepository}. */
export function createContactManagement(repository: ContactRepository, now: () => string = nowIso): ContactManagement {
  async function requireContact(organizationId: OrganizationId, contactId: ContactId): Promise<Contact> {
    const contact = await repository.findById(organizationId, contactId);
    if (!contact) throw new ContactNotFoundError(contactId);
    return contact;
  }

  async function transition(organizationId: OrganizationId, contactId: ContactId, to: ContactStatus): Promise<Contact> {
    const contact = await requireContact(organizationId, contactId);
    if (!canTransitionContact(contact.status, to)) {
      throw new InvalidRecordTransitionError('Contact', contactId, contact.status, to);
    }
    const updated: Contact = { ...contact, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const contact: Contact = {
        id: generateId('contact'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        title: input.title,
        customerId: input.customerId,
        accountId: input.accountId,
        status: 'active',
        tags: input.tags ?? [],
      };
      await repository.save(contact);
      return contact;
    },

    async update(organizationId, contactId, patch) {
      const contact = await requireContact(organizationId, contactId);
      if (contact.status !== 'active') {
        throw new InvalidRecordTransitionError('Contact', contactId, contact.status, 'updated');
      }
      const updated: Contact = {
        ...contact,
        firstName: patch.firstName ?? contact.firstName,
        lastName: patch.lastName ?? contact.lastName,
        email: patch.email ?? contact.email,
        phone: patch.phone ?? contact.phone,
        title: patch.title ?? contact.title,
        customerId: patch.customerId ?? contact.customerId,
        accountId: patch.accountId ?? contact.accountId,
        tags: patch.tags ?? contact.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, contactId) {
      return transition(organizationId, contactId, 'archived');
    },

    async restore(organizationId, contactId) {
      return transition(organizationId, contactId, 'active');
    },

    async get(organizationId, contactId) {
      return repository.findById(organizationId, contactId);
    },
  };
}
