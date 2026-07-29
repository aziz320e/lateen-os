/**
 * @lateen-os/api-gateway — API Gateway
 *
 * A real, deterministic, framework-agnostic API Gateway: API/Route/
 * Endpoint/Version registries, a Middleware Pipeline, Authentication
 * (API keys + a real JWT abstraction), Authorization (deterministic
 * Policy Evaluation), Rate Limiting and Quota Management, Request/
 * Response Validation and Response Normalization, Request Context and
 * Correlation IDs, Request Metrics and Health Endpoints, Service
 * Discovery, an OpenAPI/documentation model, and a Runtime Dispatcher
 * that composes all of the above. No HTTP server implementation, no
 * framework binding — see `runtime.ts`'s `createApiGatewayRuntime()`
 * for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as registry from './registry/index.js';
export * as middleware from './middleware/index.js';
export * as authentication from './authentication/index.js';
export * as authorization from './authorization/index.js';
export * as ratelimit from './ratelimit/index.js';
export * as validation from './validation/index.js';
export * as context from './context/index.js';
export * as metrics from './metrics/index.js';
export * as discovery from './discovery/index.js';
export * as documentation from './documentation/index.js';
export * as dispatcher from './dispatcher/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createApiGatewayRuntime,
  type ApiGatewayRuntime,
  type ApiGatewayRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Api, ApiStatus, ApiVersion, ApiVersionStatus, Endpoint, Route } from './registry/types.js';
export type { MiddlewareStep, MiddlewareStepKind } from './middleware/types.js';
export type { ApiKey, ApiKeyStatus } from './authentication/types.js';
export type { Policy, PolicyEffect, PolicyStatus } from './authorization/types.js';
export type { RateLimitPolicy, RateLimitCounter, Quota } from './ratelimit/types.js';
export type { ValidationSchema, ValidationSchemaKind, FieldSchema, FieldType } from './validation/types.js';
export type { RequestContext, RequestContextStatus } from './context/types.js';
export type { RequestMetric, HealthSnapshot } from './metrics/types.js';
export type { ServiceRegistration, ServiceStatus } from './discovery/types.js';
export type { OpenApiDocument, ApiDocumentationModel } from './documentation/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionApi,
  canTransitionApiVersion,
  type RegistryEngine,
  type RegisterApiInput,
  type CreateApiVersionInput,
  type RegisterEndpointInput,
  type RegisterRouteInput,
} from './registry/engine.impl.js';
export {
  orderSteps,
  type MiddlewarePipelineEngine,
  type RegisterMiddlewareStepInput,
} from './middleware/engine.impl.js';
export {
  signToken,
  verifyToken,
  type JwtVerificationResult,
} from './authentication/jwt.js';
export {
  type AuthenticationEngine,
  type IssueApiKeyInput,
  type IssuedApiKey,
  type AuthenticationPrincipal,
  type AuthenticationResult,
  type AuthenticateRequestInput,
} from './authentication/engine.impl.js';
export {
  matchesPattern,
  evaluatePolicies,
  type AuthorizationEngine,
  type PolicyEvaluationInput,
  type PolicyDecision,
  type CreatePolicyInput,
} from './authorization/engine.impl.js';
export {
  isWindowExpired,
  type RateLimitEngine,
  type RateLimitCheckResult,
  type CreateRateLimitPolicyInput,
  type CreateQuotaInput,
  type QuotaCheckResult,
} from './ratelimit/engine.impl.js';
export {
  validateAgainstSchema,
  normalizeResponse,
  type ValidationResult,
  type NormalizedResponse,
  type NormalizedResponseMeta,
  type ValidationEngine,
  type RegisterValidationSchemaInput,
} from './validation/engine.impl.js';
export {
  generateCorrelationId,
  type RequestContextEngine,
  type CreateRequestContextInput,
} from './context/engine.impl.js';
export {
  computeAverageDurationMs,
  computeErrorRate,
  type MetricsEngine,
  type RecordRequestMetricInput,
  type RecordHealthCheckInput,
  type OverallHealth,
} from './metrics/engine.impl.js';
export { type ServiceDiscoveryEngine } from './discovery/engine.impl.js';
export {
  buildOpenApiDocument,
  buildApiDocumentationModel,
  type DocumentationEngine,
} from './documentation/engine.impl.js';
export {
  type DispatcherEngine,
  type DispatchRequestInput,
  type DispatchResult,
} from './dispatcher/engine.impl.js';
export { buildInvokerMap, type TargetInvoker } from './dispatcher/invoker-map.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { ApiRepository, ApiVersionRepository, EndpointRepository, RouteRepository } from './registry/repository.js';
export type { MiddlewareStepRepository } from './middleware/repository.js';
export type { ApiKeyRepository } from './authentication/repository.js';
export type { PolicyRepository } from './authorization/repository.js';
export type { RateLimitPolicyRepository, RateLimitCounterRepository, QuotaRepository } from './ratelimit/repository.js';
export type { ValidationSchemaRepository } from './validation/repository.js';
export type { RequestContextRepository } from './context/repository.js';
export type { RequestMetricRepository, HealthSnapshotRepository } from './metrics/repository.js';
export type { ServiceRegistrationRepository } from './discovery/repository.js';

/** Relationship Layer (all 16 required sibling package integrations). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { GatewayQueries } from './queries/gateway-queries.js';

/** Typed event bus. */
export type { GatewayDomainEvent } from './events/gateway-events.js';
export { GATEWAY_EVENT_NAMES } from './events/gateway-events.js';
export type { GatewayEventBus } from './events/gateway-event-bus.js';
