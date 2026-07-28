/**
 * @lateen-os/customer-success-engine — Customer Success Engine
 *
 * Customer Lifecycle, Customer Health, Success Plans, Renewals,
 * Expansion, Customer Risks, and Feedback for Lateen OS. Real,
 * deterministic, offline implementation — see `runtime.ts`'s
 * `createCustomerSuccessRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as customer from './customer/index.js';
export * as health from './health/index.js';
export * as successplan from './successplan/index.js';
export * as renewal from './renewal/index.js';
export * as expansion from './expansion/index.js';
export * as risk from './risk/index.js';
export * as feedback from './feedback/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createCustomerSuccessRuntime,
  type CustomerSuccessRuntime,
  type CustomerSuccessRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { CustomerSuccessRecord, CustomerSuccessStatus } from './customer/types.js';
export type { HealthSnapshot, HealthTier } from './health/types.js';
export type { SuccessPlan, SuccessPlanStatus, PlanObjective, PlanObjectiveStatus, PlanMilestone, PlanMilestoneStatus, PlanTask, PlanTaskStatus } from './successplan/types.js';
export type { Renewal, RenewalStatus, RenewalReminder } from './renewal/types.js';
export type { ExpansionOpportunity, ExpansionOpportunityStatus, ExpansionOpportunityType } from './expansion/types.js';
export type { CustomerRisk, CustomerRiskStatus, CustomerRiskLevel } from './risk/types.js';
export type { FeedbackEntry, FeedbackType } from './feedback/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionCustomerSuccess,
  type CustomerLifecycleEngine,
  type OnboardCustomerInput,
} from './customer/engine.impl.js';
export {
  computeHealthScore,
  computeHealthTier,
  type CustomerHealthEngine,
  type HealthComponents,
  type RecordHealthSnapshotInput,
} from './health/engine.impl.js';
export {
  canTransitionSuccessPlan,
  type SuccessPlanEngine,
  type CreateSuccessPlanInput,
  type CreatePlanObjectiveInput,
  type CreatePlanMilestoneInput,
  type CreatePlanTaskInput,
} from './successplan/engine.impl.js';
export {
  canTransitionRenewal,
  type RenewalEngine,
  type CreateRenewalInput,
  type SendReminderInput,
  type RenewalOutcome,
} from './renewal/engine.impl.js';
export {
  canTransitionExpansion,
  type ExpansionEngine,
  type IdentifyExpansionOpportunityInput,
} from './expansion/engine.impl.js';
export {
  canTransitionCustomerRisk,
  computeCustomerRiskScore,
  computeCustomerRiskLevel,
  type CustomerRiskEngine,
  type CreateCustomerRiskInput,
  type UpdateCustomerRiskInput,
} from './risk/engine.impl.js';
export {
  computeNpsCategory,
  computeNpsScore,
  computeAverageCsat,
  type NpsCategory,
  type FeedbackEngine,
  type RecordFeedbackInput,
} from './feedback/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { CustomerSuccessRecordRepository } from './customer/repository.js';
export type { HealthSnapshotRepository } from './health/repository.js';
export type { SuccessPlanRepository, PlanObjectiveRepository, PlanMilestoneRepository, PlanTaskRepository } from './successplan/repository.js';
export type { RenewalRepository } from './renewal/repository.js';
export type { ExpansionOpportunityRepository } from './expansion/repository.js';
export type { CustomerRiskRepository } from './risk/repository.js';
export type { FeedbackEntryRepository } from './feedback/repository.js';

/** Relationship Layer (CRM Engine / Sales Engine / Project Management Engine / Communication Hub / Analytics Engine / Business DNA / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { CustomerSuccessQueries } from './queries/customer-success-queries.js';

/** Typed event bus. */
export type { CustomerSuccessDomainEvent } from './events/customer-success-events.js';
export { CUSTOMER_SUCCESS_EVENT_NAMES } from './events/customer-success-events.js';
export type { CustomerSuccessEventBus } from './events/customer-success-event-bus.js';
