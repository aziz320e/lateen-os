/**
 * Sales Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Sales Opportunity
 * Lifecycle + Pipeline, the Quote Engine, Product Pricing, the Sales
 * Forecast engine, the Commission Engine, the Sales Activities timeline,
 * Sales Tasks, the Relationship Layer (the only integration point with
 * CRM Engine, Business DNA, and Institutional Memory), Performance
 * Metrics, the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link SalesRuntime} surface.
 *
 * @module runtime
 */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import { createSalesActivityRepository, createSalesActivityTimeline, type SalesActivityTimeline } from './activity/index.js';
import { createCommissionEngine, createCommissionPlanRepository, type CommissionEngine } from './commission/index.js';
import { createSalesEventBus, type SalesEventBus } from './events/index.js';
import { createForecastEngine, createForecastSnapshotRepository, type ForecastEngine } from './forecast/index.js';
import { createPerformanceMetricsEngine, type PerformanceMetricsEngine } from './metrics/index.js';
import {
  createSalesOpportunityLifecycle,
  createSalesOpportunityRepository,
  type SalesOpportunityLifecycle,
} from './opportunity/index.js';
import { createProductPricingService, type ProductPricingService } from './pricing/index.js';
import { createQuoteEngine, createQuoteRepository, createQuoteVersionRepository, type QuoteEngine } from './quote/index.js';
import { createSalesQueries, type SalesQueries } from './queries/index.js';
import {
  createRelationshipManagement,
  type RelationshipManagement,
  type RelationshipManagementDeps,
} from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import { createSalesTaskRepository, createSalesTasksService, type SalesTasksDeps, type SalesTasksService } from './task/index.js';

export interface SalesRuntimeDeps {
  readonly eventBus?: SalesEventBus;
  readonly now?: () => string;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'products' | 'businessProfile'>;
  readonly crm?: RelationshipManagementDeps['crm'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
  readonly workflow?: SalesTasksDeps['workflow'];
}

export interface SalesRuntime {
  readonly opportunities: SalesOpportunityLifecycle;
  readonly quotes: QuoteEngine;
  readonly pricing: ProductPricingService;
  readonly forecast: ForecastEngine;
  readonly commissions: CommissionEngine;
  readonly activities: SalesActivityTimeline;
  readonly tasks: SalesTasksService;
  readonly relationships: RelationshipManagement;
  readonly metrics: PerformanceMetricsEngine;
  readonly queries: SalesQueries;
  /** Typed event bus — subscribe to opportunity/proposal/negotiation/deal/quote/forecast events. */
  readonly events: SalesEventBus;
}

/** Creates a real, in-memory {@link SalesRuntime}. */
export function createSalesRuntime(deps: SalesRuntimeDeps = {}): SalesRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createSalesEventBus();

  const opportunityRepository = createSalesOpportunityRepository();
  const quoteRepository = createQuoteRepository();
  const quoteVersionRepository = createQuoteVersionRepository();
  const forecastRepository = createForecastSnapshotRepository();
  const commissionPlanRepository = createCommissionPlanRepository();
  const activityRepository = createSalesActivityRepository();
  const taskRepository = createSalesTaskRepository();

  const opportunities = createSalesOpportunityLifecycle(opportunityRepository, eventBus, now);
  const quotes = createQuoteEngine(quoteRepository, quoteVersionRepository, eventBus, now);
  const pricing = createProductPricingService({ businessDna: deps.businessDna });
  const forecast = createForecastEngine(opportunityRepository, forecastRepository, eventBus, now);
  const commissions = createCommissionEngine(commissionPlanRepository, now);
  const activities = createSalesActivityTimeline(activityRepository, now);
  const tasks = createSalesTasksService(taskRepository, { workflow: deps.workflow }, eventBus, now);
  const relationships = createRelationshipManagement({
    crm: deps.crm,
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
  });
  const metrics = createPerformanceMetricsEngine(opportunityRepository);

  const queries = createSalesQueries({
    opportunityRepository,
    quoteRepository,
    forecastRepository,
    activityRepository,
    taskRepository,
  });

  return {
    opportunities,
    quotes,
    pricing,
    forecast,
    commissions,
    activities,
    tasks,
    relationships,
    metrics,
    queries,
    events: eventBus,
  };
}
