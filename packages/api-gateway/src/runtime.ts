/**
 * API Gateway Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the Registry (API/
 * Version/Endpoint/Route), the Middleware Pipeline, Authentication
 * (API keys + JWT), Authorization (Policy Evaluation), Rate Limiting
 * and Quota Management, Validation (request/response + response
 * normalization), Request Context, Metrics and Health, Service
 * Discovery, Documentation (OpenAPI + human-readable model), the
 * Runtime Dispatcher (composed over everything above plus the
 * Relationship Layer), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they
 * are never part of the returned {@link ApiGatewayRuntime} surface.
 *
 * @module runtime
 */
import { createAuthenticationEngine, createApiKeyRepository, type AuthenticationEngine } from './authentication/index.js';
import { createAuthorizationEngine, createPolicyRepository, type AuthorizationEngine } from './authorization/index.js';
import { createRequestContextEngine, createRequestContextRepository, type RequestContextEngine } from './context/index.js';
import { createDispatcherEngine, type DispatcherEngine } from './dispatcher/index.js';
import { createDocumentationEngine, type DocumentationEngine } from './documentation/index.js';
import { createServiceDiscoveryEngine, createServiceRegistrationRepository, type ServiceDiscoveryEngine } from './discovery/index.js';
import { createGatewayEventBus, type GatewayEventBus } from './events/index.js';
import { createHealthSnapshotRepository, createMetricsEngine, createRequestMetricRepository, type MetricsEngine } from './metrics/index.js';
import { createMiddlewarePipelineEngine, createMiddlewareStepRepository, type MiddlewarePipelineEngine } from './middleware/index.js';
import {
  createQuotaRepository,
  createRateLimitCounterRepository,
  createRateLimitEngine,
  createRateLimitPolicyRepository,
  type RateLimitEngine,
} from './ratelimit/index.js';
import {
  createApiRepository,
  createApiVersionRepository,
  createEndpointRepository,
  createRegistryEngine,
  createRouteRepository,
  type RegistryEngine,
} from './registry/index.js';
import { createGatewayQueries, type GatewayQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import { createValidationEngine, createValidationSchemaRepository, type ValidationEngine } from './validation/index.js';

export interface ApiGatewayRuntimeDeps {
  readonly eventBus?: GatewayEventBus;
  readonly now?: () => string;
  readonly aiRuntime?: RelationshipManagementDeps['aiRuntime'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly crm?: RelationshipManagementDeps['crm'];
  readonly sales?: RelationshipManagementDeps['sales'];
  readonly marketing?: RelationshipManagementDeps['marketing'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly finance?: RelationshipManagementDeps['finance'];
  readonly hr?: RelationshipManagementDeps['hr'];
  readonly inventory?: RelationshipManagementDeps['inventory'];
  readonly projects?: RelationshipManagementDeps['projects'];
  readonly customerSuccess?: RelationshipManagementDeps['customerSuccess'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly observability?: RelationshipManagementDeps['observability'];
  readonly aiSecurity?: RelationshipManagementDeps['aiSecurity'];
  readonly aiGovernance?: RelationshipManagementDeps['aiGovernance'];
  readonly aiCompliance?: RelationshipManagementDeps['aiCompliance'];
}

export interface ApiGatewayRuntime {
  readonly registry: RegistryEngine;
  readonly middleware: MiddlewarePipelineEngine;
  readonly authentication: AuthenticationEngine;
  readonly authorization: AuthorizationEngine;
  readonly rateLimit: RateLimitEngine;
  readonly validation: ValidationEngine;
  readonly requestContext: RequestContextEngine;
  readonly metrics: MetricsEngine;
  readonly discovery: ServiceDiscoveryEngine;
  readonly documentation: DocumentationEngine;
  readonly dispatcher: DispatcherEngine;
  readonly relationshipManagement: RelationshipManagement;
  readonly queries: GatewayQueries;
  /** Typed event bus — subscribe to api/route/version/apikey/request/ratelimit/quota events. */
  readonly events: GatewayEventBus;
}

/** Creates a real, in-memory {@link ApiGatewayRuntime}. */
export function createApiGatewayRuntime(deps: ApiGatewayRuntimeDeps = {}): ApiGatewayRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createGatewayEventBus();

  const apiRepository = createApiRepository();
  const versionRepository = createApiVersionRepository();
  const endpointRepository = createEndpointRepository();
  const routeRepository = createRouteRepository();

  const middlewareStepRepository = createMiddlewareStepRepository();
  const apiKeyRepository = createApiKeyRepository();
  const policyRepository = createPolicyRepository();
  const rateLimitPolicyRepository = createRateLimitPolicyRepository();
  const rateLimitCounterRepository = createRateLimitCounterRepository();
  const quotaRepository = createQuotaRepository();
  const validationSchemaRepository = createValidationSchemaRepository();
  const requestContextRepository = createRequestContextRepository();
  const requestMetricRepository = createRequestMetricRepository();
  const healthSnapshotRepository = createHealthSnapshotRepository();
  const serviceRegistrationRepository = createServiceRegistrationRepository();

  const registry = createRegistryEngine(apiRepository, versionRepository, endpointRepository, routeRepository, eventBus, now);
  const middleware = createMiddlewarePipelineEngine(middlewareStepRepository, now);
  const authentication = createAuthenticationEngine(apiKeyRepository, eventBus, now);
  const authorization = createAuthorizationEngine(policyRepository, now);
  const rateLimit = createRateLimitEngine(rateLimitPolicyRepository, rateLimitCounterRepository, quotaRepository, eventBus, now);
  const validation = createValidationEngine(validationSchemaRepository, now);
  const requestContext = createRequestContextEngine(requestContextRepository, now);
  const metrics = createMetricsEngine(requestMetricRepository, healthSnapshotRepository, now);
  const discovery = createServiceDiscoveryEngine(serviceRegistrationRepository, now);
  const documentation = createDocumentationEngine(registry);

  const relationshipManagement = createRelationshipManagement({
    aiRuntime: deps.aiRuntime,
    workflow: deps.workflow,
    crm: deps.crm,
    sales: deps.sales,
    marketing: deps.marketing,
    communicationHub: deps.communicationHub,
    finance: deps.finance,
    hr: deps.hr,
    inventory: deps.inventory,
    projects: deps.projects,
    customerSuccess: deps.customerSuccess,
    analytics: deps.analytics,
    observability: deps.observability,
    aiSecurity: deps.aiSecurity,
    aiGovernance: deps.aiGovernance,
    aiCompliance: deps.aiCompliance,
  });

  const dispatcher = createDispatcherEngine(
    registry,
    discovery,
    authentication,
    authorization,
    rateLimit,
    validation,
    requestContext,
    metrics,
    relationshipManagement,
    eventBus,
    now,
  );

  const queries = createGatewayQueries({
    apiRepository,
    routeRepository,
    apiKeyRepository,
    policyRepository,
    requestContextRepository,
    requestMetricRepository,
    healthSnapshotRepository,
    serviceRegistrationRepository,
  });

  return {
    registry,
    middleware,
    authentication,
    authorization,
    rateLimit,
    validation,
    requestContext,
    metrics,
    discovery,
    documentation,
    dispatcher,
    relationshipManagement,
    queries,
    events: eventBus,
  };
}
