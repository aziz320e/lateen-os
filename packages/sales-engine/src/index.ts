/**
 * @lateen-os/sales-engine — Sales Engine
 *
 * Sales opportunity lifecycle, deterministic pipeline, quotes, pricing,
 * forecasting, commissions, activities, and tasks for Lateen OS. Real,
 * deterministic, offline implementation — see `runtime.ts`'s
 * `createSalesRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as opportunity from './opportunity/index.js';
export * as quote from './quote/index.js';
export * as pricing from './pricing/index.js';
export * as forecast from './forecast/index.js';
export * as commission from './commission/index.js';
export * as activity from './activity/index.js';
export * as task from './task/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as metrics from './metrics/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createSalesRuntime,
  type SalesRuntime,
  type SalesRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { SalesOpportunity, SalesOpportunityStatus, SalesPipelineStage, SalesOpportunityId } from './opportunity/types.js';
export type { Quote, QuoteLineItem, QuoteTotals, QuoteStatus, QuoteVersion, QuoteId, QuoteVersionId } from './quote/types.js';
export type { VolumePricingTier } from './pricing/types.js';
export type { ForecastSnapshot, MonthlyForecastBucket, ForecastSnapshotId } from './forecast/types.js';
export type { CommissionPlan, CommissionPlanType, CommissionTier, CommissionPlanStatus, CommissionPlanId } from './commission/types.js';
export type {
  SalesActivity,
  SalesActivityType,
  SalesActivityRelatedEntity,
  SalesRelatedEntityType,
  SalesActivityId,
} from './activity/types.js';
export type { SalesTask, SalesTaskType, SalesTaskStatus, SalesTaskId } from './task/types.js';
export type { SalesPerformanceMetrics } from './metrics/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionSalesStage,
  type SalesOpportunityLifecycle,
  type CreateSalesOpportunityInput,
  type UpdateSalesOpportunityInput,
} from './opportunity/lifecycle.impl.js';
export { computeQuoteTotals, type QuoteEngine, type CreateQuoteInput, type UpdateQuoteInput } from './quote/engine.impl.js';
export {
  computeNegotiatedPrice,
  computeVolumePrice,
  type ProductPricingService,
} from './pricing/engine.impl.js';
export {
  probabilityForStage,
  computeWeightedAmount,
  STAGE_PROBABILITY,
  type ForecastEngine,
} from './forecast/engine.impl.js';
export { calculateCommission, type CommissionEngine, type CreateCommissionPlanInput } from './commission/engine.impl.js';
export { type SalesActivityTimeline, type LogSalesActivityInput } from './activity/timeline.impl.js';
export {
  type SalesTasksService,
  type SalesTasksDeps,
  type GenerateSalesTaskInput,
  type CompleteSalesTaskOutcome,
} from './task/service.impl.js';
export {
  computeWinRate,
  computeLossRate,
  computeAverageDealSize,
  computeAverageSalesCycleDays,
  computePipelineValue,
  type PerformanceMetricsEngine,
} from './metrics/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { SalesOpportunityRepository } from './opportunity/repository.js';
export type { QuoteRepository, QuoteVersionRepository } from './quote/repository.js';
export type { ForecastSnapshotRepository } from './forecast/repository.js';
export type { CommissionPlanRepository } from './commission/repository.js';
export type { SalesActivityRepository } from './activity/repository.js';
export type { SalesTaskRepository } from './task/repository.js';

/** Relationship Layer (CRM Engine / Business DNA / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { SalesQueries } from './queries/sales-queries.js';

/** Typed event bus. */
export type { SalesDomainEvent } from './events/sales-events.js';
export { SALES_EVENT_NAMES } from './events/sales-events.js';
