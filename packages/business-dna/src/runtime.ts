/**
 * Business DNA Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Organization Lifecycle,
 * the Business Profile service, the Vision & Mission Engine, the Business
 * DNA Engine (ICP/personas/positioning/tone/brand rules/competitive
 * advantages), the Market Model, the Competitor Registry, the Product
 * Catalog, the Policy Engine, the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link BusinessDnaRuntime} surface.
 *
 * @module runtime
 */
import { createOrganizationLifecycle, createOrganizationRepository, type OrganizationLifecycle } from './organization/index.js';
import { createBusinessProfileRepository, createBusinessProfileService, type BusinessProfileService } from './business-profile/index.js';
import { createVisionMissionEngine, createVisionMissionRepository, type VisionMissionEngine } from './vision-mission/index.js';
import { createBusinessDnaProfileRepository, createDnaEngine, type DnaEngine } from './dna/index.js';
import { createMarketEngine, createMarketModelRepository, type MarketEngine } from './market/index.js';
import { createCompetitorRegistry, createCompetitorRepository, type CompetitorRegistry } from './competitor/index.js';
import {
  createProductBundleRepository,
  createProductCatalogService,
  createProductRepository,
  type ProductCatalogService,
} from './product/index.js';
import { createPolicyEngine, createPolicyRepository, type PolicyEngine } from './policy/index.js';
import { createBusinessDnaQueries, type BusinessDnaQueries } from './queries/index.js';
import { createBusinessDnaEventBus, type BusinessDnaEventBus } from './events/index.js';
import { nowIso } from './shared/id.js';

export interface BusinessDnaRuntimeDeps {
  readonly eventBus?: BusinessDnaEventBus;
  readonly now?: () => string;
}

export interface BusinessDnaRuntime {
  readonly organization: OrganizationLifecycle;
  readonly businessProfile: BusinessProfileService;
  readonly visionMission: VisionMissionEngine;
  readonly dna: DnaEngine;
  readonly market: MarketEngine;
  readonly competitors: CompetitorRegistry;
  readonly products: ProductCatalogService;
  readonly policies: PolicyEngine;
  readonly queries: BusinessDnaQueries;
  /** Typed event bus — subscribe to organization/business-profile/product/competitor/policy events. */
  readonly events: BusinessDnaEventBus;
}

/** Creates a real, in-memory {@link BusinessDnaRuntime}. */
export function createBusinessDnaRuntime(deps: BusinessDnaRuntimeDeps = {}): BusinessDnaRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createBusinessDnaEventBus();

  const organizationRepository = createOrganizationRepository();
  const businessProfileRepository = createBusinessProfileRepository();
  const visionMissionRepository = createVisionMissionRepository();
  const businessDnaProfileRepository = createBusinessDnaProfileRepository();
  const marketModelRepository = createMarketModelRepository();
  const competitorRepository = createCompetitorRepository();
  const productRepository = createProductRepository();
  const productBundleRepository = createProductBundleRepository();
  const policyRepository = createPolicyRepository();

  const organization = createOrganizationLifecycle(organizationRepository, eventBus, now);
  const businessProfile = createBusinessProfileService(businessProfileRepository, eventBus, now);
  const visionMission = createVisionMissionEngine(visionMissionRepository, now);
  const dna = createDnaEngine(businessDnaProfileRepository, now);
  const market = createMarketEngine(marketModelRepository, now);
  const competitors = createCompetitorRegistry(competitorRepository, eventBus, now);
  const products = createProductCatalogService(productRepository, productBundleRepository, eventBus, now);
  const policies = createPolicyEngine(policyRepository, eventBus, now);

  const queries = createBusinessDnaQueries({
    organizationRepository,
    businessProfileRepository,
    productRepository,
    competitorRepository,
    policyRepository,
    marketModelRepository,
  });

  return {
    organization,
    businessProfile,
    visionMission,
    dna,
    market,
    competitors,
    products,
    policies,
    queries,
    events: eventBus,
  };
}
