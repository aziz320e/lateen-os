/**
 * Marketing Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Campaign Lifecycle, the
 * Audience Engine, Lead Generation + Lead Scoring, the Content Library,
 * the Marketing Calendar, the Attribution engine, Marketing Metrics,
 * Workflow Integration, the Relationship Layer (the only integration
 * point with CRM Engine, Sales Engine, Business DNA, Institutional
 * Memory, and Domain Graph), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link MarketingRuntime} surface.
 *
 * @module runtime
 */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import { createAudienceEngine, createAudienceRepository, type AudienceEngine } from './audience/index.js';
import { createAttributionEngine, createTouchpointRepository, type AttributionEngine } from './attribution/index.js';
import { createCalendarRepository, createMarketingCalendarService, type MarketingCalendarService } from './calendar/index.js';
import { createCampaignLifecycle, createCampaignRepository, type CampaignLifecycle } from './campaign/index.js';
import { createContentLibrary, createContentRepository, type ContentLibrary } from './content/index.js';
import { createMarketingEventBus, type MarketingEventBus } from './events/index.js';
import { createLeadGenerationService, createMarketingLeadRepository, type LeadGenerationService } from './lead-generation/index.js';
import { createLeadScoringEngine, type LeadScoringEngine } from './lead-scoring/index.js';
import { createMarketingMetricsEngine, createMarketingMetricsRepository, type MarketingMetricsEngine } from './metrics/index.js';
import { createMarketingQueries, type MarketingQueries } from './queries/index.js';
import {
  createRelationshipManagement,
  type RelationshipManagement,
  type RelationshipManagementDeps,
} from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import {
  createWorkflowIntegrationService,
  createWorkflowRequestRepository,
  type WorkflowIntegrationDeps,
  type WorkflowIntegrationService,
} from './workflow-integration/index.js';

export interface MarketingRuntimeDeps {
  readonly eventBus?: MarketingEventBus;
  readonly now?: () => string;
  readonly crm?: Pick<CrmRuntime, 'leads' | 'customers' | 'queries'>;
  readonly sales?: RelationshipManagementDeps['sales'];
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
  readonly domainGraph?: RelationshipManagementDeps['domainGraph'];
  readonly workflow?: WorkflowIntegrationDeps['workflow'];
}

export interface MarketingRuntime {
  readonly campaigns: CampaignLifecycle;
  readonly audiences: AudienceEngine;
  readonly leadGeneration: LeadGenerationService;
  readonly leadScoring: LeadScoringEngine;
  readonly content: ContentLibrary;
  readonly calendar: MarketingCalendarService;
  readonly attribution: AttributionEngine;
  readonly metrics: MarketingMetricsEngine;
  readonly workflows: WorkflowIntegrationService;
  readonly relationships: RelationshipManagement;
  readonly queries: MarketingQueries;
  /** Typed event bus — subscribe to campaign/lead/content/workflow/metrics events. */
  readonly events: MarketingEventBus;
}

/** Creates a real, in-memory {@link MarketingRuntime}. */
export function createMarketingRuntime(deps: MarketingRuntimeDeps = {}): MarketingRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createMarketingEventBus();

  const campaignRepository = createCampaignRepository();
  const audienceRepository = createAudienceRepository();
  const leadRepository = createMarketingLeadRepository();
  const contentRepository = createContentRepository();
  const calendarRepository = createCalendarRepository();
  const touchpointRepository = createTouchpointRepository();
  const metricsRepository = createMarketingMetricsRepository();
  const workflowRequestRepository = createWorkflowRequestRepository();

  const campaigns = createCampaignLifecycle(campaignRepository, eventBus, now);
  const audiences = createAudienceEngine(audienceRepository, { crm: deps.crm }, now);
  const leadGeneration = createLeadGenerationService(leadRepository, eventBus, now);
  const leadScoring = createLeadScoringEngine(leadRepository, eventBus, now);
  const content = createContentLibrary(contentRepository, eventBus, now);
  const calendar = createMarketingCalendarService(calendarRepository, now);
  const attribution = createAttributionEngine(touchpointRepository, now);
  const metrics = createMarketingMetricsEngine(metricsRepository, eventBus, now);
  const workflows = createWorkflowIntegrationService(workflowRequestRepository, { workflow: deps.workflow }, eventBus, now);
  const relationships = createRelationshipManagement({
    crm: deps.crm,
    sales: deps.sales,
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
    domainGraph: deps.domainGraph,
  });

  const queries = createMarketingQueries({
    campaignRepository,
    audienceRepository,
    contentRepository,
    leadRepository,
    metricsRepository,
    calendarRepository,
  });

  return {
    campaigns,
    audiences,
    leadGeneration,
    leadScoring,
    content,
    calendar,
    attribution,
    metrics,
    workflows,
    relationships,
    queries,
    events: eventBus,
  };
}
