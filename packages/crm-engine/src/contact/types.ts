/** @module contact/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountId, ContactId, CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, Email, Phone } from '../shared/primitives.js';

export type { ContactId };

export type ContactStatus = 'active' | 'archived';

/** An individual person, optionally linked to a Customer and/or Account. */
export interface Contact extends TenantAuditableEntity<ContactId> {
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly title?: string;
  readonly customerId?: CustomerId;
  readonly accountId?: AccountId;
  readonly status: ContactStatus;
  readonly tags: readonly CrmTag[];
}

/** Deterministic "First Last" display name — never stored, always derived. */
export function contactFullName(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export type { OrganizationId };
