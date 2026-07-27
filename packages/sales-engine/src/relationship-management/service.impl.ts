/**
 * Real Relationship Layer — the Sales Engine's only integration point
 * with CRM Engine, Business DNA, and Institutional Memory, each
 * exclusively through its public API (never a repository, never a
 * mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Sales Engine remains fully
 * usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { Account, AccountId, Contact, ContactId, Customer, CustomerId } from '@lateen-os/crm-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { SalesActivity } from '../activity/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RelationshipManagement {
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer | null>;
  /** Real CRM Engine contact, fetched by id. `null` if CRM Engine is not injected or the contact is unknown. */
  getContactContext(organizationId: OrganizationId, contactId: ContactId): Promise<Contact | null>;
  /** Real CRM Engine account, fetched by id. `null` if CRM Engine is not injected or the account is unknown. */
  getAccountContext(organizationId: OrganizationId, accountId: AccountId): Promise<Account | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a significant sales activity as a real Institutional Memory `'observation'` knowledge entry. `null` if Institutional Memory is not injected. */
  logActivityToMemory(organizationId: OrganizationId, activity: SalesActivity): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected CRM / Business DNA / Institutional Memory collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async getCustomerContext(organizationId, customerId) {
      if (!deps.crm) return null;
      return deps.crm.customers.get(organizationId, customerId);
    },

    async getContactContext(organizationId, contactId) {
      if (!deps.crm) return null;
      return deps.crm.contacts.get(organizationId, contactId);
    },

    async getAccountContext(organizationId, accountId) {
      if (!deps.crm) return null;
      return deps.crm.accounts.get(organizationId, accountId);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logActivityToMemory(organizationId, activity) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: activity.subject,
        content: activity.notes ?? activity.subject,
        knowledgeType: 'observation',
        category: 'commercial',
        source: 'sales-engine',
        tags: [activity.activityType, activity.relatedTo.entityType],
      });
    },
  };
}
