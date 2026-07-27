/**
 * CRM Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Customer Lifecycle, Lead
 * Management, Contact Management, Account Management, the Opportunity
 * Pipeline, the Activity Timeline, Duplicate Detection, Relationship
 * Management (the only integration point with Business DNA, Institutional
 * Memory, and Domain Graph), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link CrmRuntime} surface.
 *
 * @module runtime
 */
import { createAccountManagement, createAccountRepository, type AccountManagement } from './account/index.js';
import { createActivityRepository, createActivityTimeline, type ActivityTimeline } from './activity/index.js';
import { createContactManagement, createContactRepository, type ContactManagement } from './contact/index.js';
import { createCustomerLifecycle, createCustomerRepository, type CustomerLifecycle } from './customer/index.js';
import {
  createCrmDuplicateDetectionEngine,
  type CrmDuplicateDetectionEngine,
} from './duplicate-detection/index.js';
import { createCrmEventBus, type CrmEventBus } from './events/index.js';
import { createLeadLifecycle, createLeadRepository, type LeadLifecycle } from './lead/index.js';
import { createOpportunityPipeline, createOpportunityRepository, type OpportunityPipeline } from './opportunity/index.js';
import { createCrmQueries, type CrmQueries } from './queries/index.js';
import {
  createRelationshipManagement,
  type RelationshipManagement,
  type RelationshipManagementDeps,
} from './relationship-management/index.js';
import { nowIso } from './shared/id.js';

export interface CrmRuntimeDeps {
  readonly eventBus?: CrmEventBus;
  readonly now?: () => string;
  readonly domainGraph?: RelationshipManagementDeps['domainGraph'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface CrmRuntime {
  readonly customers: CustomerLifecycle;
  readonly leads: LeadLifecycle;
  readonly contacts: ContactManagement;
  readonly accounts: AccountManagement;
  readonly opportunities: OpportunityPipeline;
  readonly activities: ActivityTimeline;
  readonly duplicates: CrmDuplicateDetectionEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: CrmQueries;
  /** Typed event bus — subscribe to lead/customer/opportunity/activity events. */
  readonly events: CrmEventBus;
}

/** Creates a real, in-memory {@link CrmRuntime}. */
export function createCrmRuntime(deps: CrmRuntimeDeps = {}): CrmRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createCrmEventBus();

  const customerRepository = createCustomerRepository();
  const leadRepository = createLeadRepository();
  const contactRepository = createContactRepository();
  const accountRepository = createAccountRepository();
  const opportunityRepository = createOpportunityRepository();
  const activityRepository = createActivityRepository();

  const customers = createCustomerLifecycle(customerRepository, eventBus, now);
  const leads = createLeadLifecycle(leadRepository, customers, eventBus, now);
  const contacts = createContactManagement(contactRepository, now);
  const accounts = createAccountManagement(accountRepository, now);
  const opportunities = createOpportunityPipeline(opportunityRepository, eventBus, now);
  const activities = createActivityTimeline(activityRepository, eventBus, now);
  const duplicates = createCrmDuplicateDetectionEngine(customerRepository, leadRepository);
  const relationships = createRelationshipManagement({
    domainGraph: deps.domainGraph,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createCrmQueries({
    customerRepository,
    leadRepository,
    contactRepository,
    accountRepository,
    opportunityRepository,
    activityRepository,
  });

  return {
    customers,
    leads,
    contacts,
    accounts,
    opportunities,
    activities,
    duplicates,
    relationships,
    queries,
    events: eventBus,
  };
}
