/**
 * @lateen-os/marketing-engine — Marketing Engine
 *
 * Campaign lifecycle, audience engine, lead generation and scoring,
 * content library, marketing calendar, attribution, and metrics for
 * Lateen OS. Real, deterministic, offline implementation — see
 * `runtime.ts`'s `createMarketingRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as campaign from './campaign/index.js';
export * as audience from './audience/index.js';
export * as leadGeneration from './lead-generation/index.js';
export * as leadScoring from './lead-scoring/index.js';
export * as content from './content/index.js';
export * as calendar from './calendar/index.js';
export * as attribution from './attribution/index.js';
export * as metrics from './metrics/index.js';
export * as workflowIntegration from './workflow-integration/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createMarketingRuntime,
  type MarketingRuntime,
  type MarketingRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Campaign, CampaignType, CampaignStatus, CampaignId } from './campaign/types.js';
export type { Audience, AudienceType, AudienceStatus, AudienceFilter, AudienceFilterField, AudienceFilterOperator, AudienceId } from './audience/types.js';
export type { MarketingLead, LeadSource, MarketingLeadStatus, MarketingLeadId } from './lead-generation/types.js';
export type { ContentItem, ContentType, ContentStatus, ContentItemId } from './content/types.js';
export type { CalendarEntry, RecurrenceRule, RecurrenceFrequency, CalendarEntryStatus, CalendarEntryId } from './calendar/types.js';
export type { Touchpoint, AttributionCredit, AttributionModel, TouchpointId } from './attribution/types.js';
export type { MarketingMetricsCounters, MarketingMetricsDerived, MarketingMetricsSnapshot, RecordMetricsInput } from './metrics/types.js';
export type { WorkflowRequest, MarketingWorkflowType, WorkflowRequestStatus, WorkflowRequestId } from './workflow-integration/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionCampaign,
  type CampaignLifecycle,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type ScheduleCampaignInput,
} from './campaign/lifecycle.impl.js';
export {
  applyAudienceFilters,
  type AudienceEngine,
  type AudienceEngineDeps,
  type CreateAudienceInput,
  type UpdateAudienceInput,
} from './audience/engine.impl.js';
export { type LeadGenerationService, type GenerateLeadInput } from './lead-generation/service.impl.js';
export {
  computeLeadScore,
  computeRecencyScore,
  SOURCE_SCORE_WEIGHT,
  type LeadScoringEngine,
} from './lead-scoring/engine.impl.js';
export { type ContentLibrary, type CreateContentItemInput, type UpdateContentItemInput } from './content/library.impl.js';
export {
  generateOccurrences,
  type MarketingCalendarService,
  type ScheduleCalendarEntryInput,
  type UpdateCalendarEntryInput,
} from './calendar/service.impl.js';
export { computeAttribution, type AttributionEngine } from './attribution/engine.impl.js';
export { computeDerivedMetrics, type MarketingMetricsEngine } from './metrics/engine.impl.js';
export {
  type WorkflowIntegrationService,
  type WorkflowIntegrationDeps,
  type GenerateWorkflowRequestInput,
  type CompleteWorkflowRequestOutcome,
} from './workflow-integration/service.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { CampaignRepository } from './campaign/repository.js';
export type { AudienceRepository } from './audience/repository.js';
export type { MarketingLeadRepository } from './lead-generation/repository.js';
export type { ContentRepository } from './content/repository.js';
export type { CalendarRepository } from './calendar/repository.js';
export type { TouchpointRepository } from './attribution/repository.js';
export type { MarketingMetricsRepository } from './metrics/repository.js';
export type { WorkflowRequestRepository } from './workflow-integration/repository.js';

/** Relationship Layer (CRM Engine / Sales Engine / Business DNA / Institutional Memory / Domain Graph integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { MarketingQueries } from './queries/marketing-queries.js';

/** Typed event bus. */
export type { MarketingDomainEvent } from './events/marketing-events.js';
export { MARKETING_EVENT_NAMES } from './events/marketing-events.js';
