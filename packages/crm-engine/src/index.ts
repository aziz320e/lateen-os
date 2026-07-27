/**
 * @lateen-os/crm-engine — CRM Engine
 *
 * Customer, lead, contact, account, and opportunity management for
 * Lateen OS. Real, deterministic, offline implementation — see
 * `runtime.ts`'s `createCrmRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as customer from './customer/index.js';
export * as lead from './lead/index.js';
export * as contact from './contact/index.js';
export * as account from './account/index.js';
export * as opportunity from './opportunity/index.js';
export * as activity from './activity/index.js';
export * as duplicateDetection from './duplicate-detection/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createCrmRuntime,
  type CrmRuntime,
  type CrmRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Customer, CustomerStatus, CustomerId } from './customer/types.js';
export type { Lead, LeadStatus, LeadId } from './lead/types.js';
export type { Contact, ContactStatus, ContactId } from './contact/types.js';
export { contactFullName } from './contact/types.js';
export type { Account, AccountStatus, AccountId } from './account/types.js';
export type { Opportunity, DealStage, OpportunityId } from './opportunity/types.js';
export type { Activity, ActivityType, ActivityRelatedEntity, RelatedEntityType, ActivityId } from './activity/types.js';

/** Real lifecycle/service ports. */
export { canTransitionCustomer, type CustomerLifecycle, type CreateCustomerInput, type UpdateCustomerInput, type MergeCustomersResult } from './customer/lifecycle.impl.js';
export { canTransitionLead, type LeadLifecycle, type CreateLeadInput, type ConvertLeadInput, type ConvertLeadResult } from './lead/lifecycle.impl.js';
export { canTransitionContact, type ContactManagement, type CreateContactInput, type UpdateContactInput } from './contact/service.impl.js';
export { canTransitionAccount, type AccountManagement, type CreateAccountInput, type UpdateAccountInput } from './account/service.impl.js';
export { canTransitionDealStage, type OpportunityPipeline, type CreateOpportunityInput, type UpdateOpportunityInput } from './opportunity/pipeline.impl.js';
export { type ActivityTimeline, type LogActivityInput } from './activity/timeline.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { CustomerRepository } from './customer/repository.js';
export type { LeadRepository } from './lead/repository.js';
export type { ContactRepository } from './contact/repository.js';
export type { AccountRepository } from './account/repository.js';
export type { OpportunityRepository } from './opportunity/repository.js';
export type { ActivityRepository } from './activity/repository.js';

/** Duplicate Detection. */
export {
  createCrmDuplicateDetectionEngine,
  detectDuplicates,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  type CrmDuplicateDetectionEngine,
} from './duplicate-detection/engine.impl.js';
export type { DuplicateCandidateInput, DuplicateMatch, DuplicateMatchField } from './duplicate-detection/types.js';

/** Relationship Management (Business DNA / Domain Graph / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Real query layer. */
export type { CrmQueries } from './queries/crm-queries.js';

/** Typed event bus. */
export type { CrmDomainEvent } from './events/crm-events.js';
export { CRM_EVENT_NAMES } from './events/crm-events.js';
