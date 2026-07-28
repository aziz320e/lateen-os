/**
 * Customer Success Runtime — the package's composition root. Wires
 * every real in-memory repository and service together: Customer
 * Lifecycle, Customer Health, Success Plans, Renewals, Expansion,
 * Customer Risks, Feedback, the Relationship Layer (the only
 * integration point with CRM Engine, Sales Engine, Project Management
 * Engine, Communication Hub, Analytics Engine, Business DNA, and
 * Institutional Memory), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they
 * are never part of the returned {@link CustomerSuccessRuntime}
 * surface.
 *
 * @module runtime
 */
import { createCustomerLifecycleEngine, createCustomerSuccessRecordRepository, type CustomerLifecycleEngine } from './customer/index.js';
import { createCustomerSuccessEventBus, type CustomerSuccessEventBus } from './events/index.js';
import { createExpansionEngine, createExpansionOpportunityRepository, type ExpansionEngine } from './expansion/index.js';
import { createFeedbackEngine, createFeedbackEntryRepository, type FeedbackEngine } from './feedback/index.js';
import { createCustomerHealthEngine, createHealthSnapshotRepository, type CustomerHealthEngine } from './health/index.js';
import { createCustomerSuccessQueries, type CustomerSuccessQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createRenewalEngine, createRenewalRepository, type RenewalEngine } from './renewal/index.js';
import { createCustomerRiskEngine, createCustomerRiskRepository, type CustomerRiskEngine } from './risk/index.js';
import { nowIso } from './shared/id.js';
import {
  createPlanMilestoneRepository,
  createPlanObjectiveRepository,
  createPlanTaskRepository,
  createSuccessPlanEngine,
  createSuccessPlanRepository,
  type SuccessPlanEngine,
} from './successplan/index.js';

export interface CustomerSuccessRuntimeDeps {
  readonly eventBus?: CustomerSuccessEventBus;
  readonly now?: () => string;
  readonly crm?: RelationshipManagementDeps['crm'];
  readonly sales?: RelationshipManagementDeps['sales'];
  readonly projects?: RelationshipManagementDeps['projects'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface CustomerSuccessRuntime {
  readonly customers: CustomerLifecycleEngine;
  readonly health: CustomerHealthEngine;
  readonly plans: SuccessPlanEngine;
  readonly renewals: RenewalEngine;
  readonly expansion: ExpansionEngine;
  readonly risks: CustomerRiskEngine;
  readonly feedback: FeedbackEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: CustomerSuccessQueries;
  /** Typed event bus — subscribe to customer/health/renewal/feedback/plan/risk events. */
  readonly events: CustomerSuccessEventBus;
}

/** Creates a real, in-memory {@link CustomerSuccessRuntime}. */
export function createCustomerSuccessRuntime(deps: CustomerSuccessRuntimeDeps = {}): CustomerSuccessRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createCustomerSuccessEventBus();

  const customerRepository = createCustomerSuccessRecordRepository();
  const healthRepository = createHealthSnapshotRepository();
  const planRepository = createSuccessPlanRepository();
  const objectiveRepository = createPlanObjectiveRepository();
  const milestoneRepository = createPlanMilestoneRepository();
  const taskRepository = createPlanTaskRepository();
  const renewalRepository = createRenewalRepository();
  const expansionRepository = createExpansionOpportunityRepository();
  const riskRepository = createCustomerRiskRepository();
  const feedbackRepository = createFeedbackEntryRepository();

  const customers = createCustomerLifecycleEngine(customerRepository, eventBus, now);
  const health = createCustomerHealthEngine(healthRepository, eventBus, now);
  const plans = createSuccessPlanEngine(planRepository, objectiveRepository, milestoneRepository, taskRepository, eventBus, now);
  const renewals = createRenewalEngine(renewalRepository, eventBus, now);
  const expansion = createExpansionEngine(expansionRepository, now);
  const risks = createCustomerRiskEngine(riskRepository, eventBus, now);
  const feedback = createFeedbackEngine(feedbackRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    crm: deps.crm,
    sales: deps.sales,
    projects: deps.projects,
    communicationHub: deps.communicationHub,
    analytics: deps.analytics,
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createCustomerSuccessQueries({
    customerRepository,
    healthRepository,
    renewalRepository,
    planRepository,
    feedbackRepository,
    riskRepository,
    expansionRepository,
  });

  return {
    customers,
    health,
    plans,
    renewals,
    expansion,
    risks,
    feedback,
    relationships,
    queries,
    events: eventBus,
  };
}
