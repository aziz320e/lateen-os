# Gateway Model

> Real, implemented model for the API Gateway — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## API Registry, Version Registry, Endpoint Registry, Route Registry

`registry/engine.impl.ts`'s `createRegistryEngine()` implements a four-level hierarchy, each level guarded appropriately:

- **`Api`** — `registerApi()` starts at `status: 'active'`. Publishes `api.registered`. Guarded by `canTransitionApi()` (pure): `active ⇄ deprecated → retired`, `retired` terminal.
- **`ApiVersion`** — `createVersion()` starts at `status: 'draft'`, requiring the parent `Api` to exist (`ApiNotFoundError` otherwise). Guarded by `canTransitionApiVersion()` (pure): `draft → published → deprecated → retired`, strictly linear (no skipping, no going back). `publishVersion()` publishes `version.published`.
- **`Endpoint`** — `registerEndpoint()` requires both the parent `Api` and `ApiVersion` to exist; unstatused — endpoints are simply named groupings of routes within one version.
- **`Route`** — `registerRoute()` requires the parent `Endpoint` to exist (`EndpointNotFoundError` otherwise) and rejects a duplicate `(method, path)` pair within the organization (`DuplicateRouteError`). `targetService`/`targetOperation` are opaque strings resolved only by the Runtime Dispatcher's fixed invoker table — never reflection. Publishes `route.registered`.

---

## Middleware Pipeline

`middleware/engine.impl.ts`'s `createMiddlewarePipelineEngine()` implements ordered, enable/disable-able pipeline steps:

- **`orderSteps()`** (pure) — sorts by ascending `sequence`, tie-breaking by `id` ascending; never mutates its input array.
- **`registerStep()`** — defaults `enabled` to `true`; supports 5 kinds (`authentication`, `authorization`, `validation`, `rateLimit`, `custom`).
- **`enableStep()` / `disableStep()`** — toggle the `enabled` flag; throw `MiddlewareStepNotFoundError` for an unknown step.
- **`getOrderedSteps()` / `getEnabledOrderedSteps()`** — the full or enabled-only pipeline, always in deterministic order.

---

## Authentication Pipeline, API Key Registry, JWT abstraction

`authentication/jwt.ts` implements a real, dependency-free HS256 JWT:

- **`signToken()`** — builds the standard three-segment `header.payload.signature` structure (base64url-encoded), stamping a real `iat` and an optional `exp` (via `expiresInSeconds`); signs with `crypto.createHmac('sha256', secret)`.
- **`verifyToken()`** — re-derives the signature and compares with `crypto.timingSafeEqual` (constant-time, no timing side-channel); checks `exp` against an injectable clock; returns a discriminated `{ valid: true, payload } | { valid: false, reason: 'malformed' | 'invalid_signature' | 'expired' }`.

`authentication/engine.impl.ts`'s `createAuthenticationEngine()` implements the API Key Registry and composes the pipeline:

- **`issueApiKey()`** — generates a raw key via `crypto.randomBytes(24)` (prefixed `lgw_`), persists only its SHA-256 hash (`crypto.createHash('sha256')`) plus a display `prefix`; the raw key is returned exactly once, at issuance. Publishes `apikey.issued`.
- **`revokeApiKey()`** — moves `status: 'active' → 'revoked'`. Publishes `apikey.revoked`. Throws `ApiKeyNotFoundError` for an unknown key.
- **`verifyApiKey()`** — re-hashes the presented raw key and looks it up; returns `null` if not found, revoked, or expired.
- **`authenticateRequest()`** — the full pipeline: prioritizes `apiKey` over `bearerToken` when both are given; requires `jwtSecret` alongside `bearerToken`; returns a typed `AuthenticationResult` distinguishing an `'apikey'` principal (with `scopes`) from a `'jwt'` principal (with the decoded `payload`).

---

## Authorization Pipeline, Policy Evaluation

`authorization/engine.impl.ts`'s `createAuthorizationEngine()` implements deterministic policy evaluation:

- **`matchesPattern()`** (pure) — exact match, a bare `*` matching anything, or a trailing-`*` prefix match (e.g. `/crm/*` matches `/crm/customers`).
- **`evaluatePolicies()`** (pure) — filters to `active` policies whose `resource`/`action` match and whose `principalScope` (if any) is present in the caller's `principalScopes`; among candidates, the highest-`priority` one wins (ties resolve to the first-registered candidate); no match at all is `deny`.
- **`createPolicy()`** — defaults `priority` to `0` and `status` to `'active'`.
- **`evaluate()`** — composes `createPolicy()`'s persisted policies with the pure `evaluatePolicies()` algorithm.

---

## Rate Limiting, Quota Management

`ratelimit/engine.impl.ts`'s `createRateLimitEngine()` implements two deterministic, fixed-time-window algorithms — never token buckets with jitter:

- **`isWindowExpired()`** (pure) — `secondsBetweenIso(windowStartedAt, now) >= windowSeconds`.
- **`checkAndConsume()`** — a fixed-window counter per `(policy, principal)`: increments the counter, resets it (and its window) once expired, and reports `exceeded`/`remaining` (floored at `0`). Publishes `ratelimit.exceeded` when the threshold is hit. Throws `RateLimitPolicyNotFoundError` for an unknown policy.
- **`consumeQuota()`** — a fixed-period counter per principal (`periodDays`), following the same reset-on-elapsed-time pattern. Publishes `quota.exceeded`. Throws `QuotaNotFoundError` for an unknown quota.

---

## Request Validation, Response Validation, Response Normalization

`validation/engine.impl.ts`'s `createValidationEngine()` implements a minimal, hand-rolled schema check — never a full JSON Schema implementation or an external library:

- **`validateAgainstSchema()`** (pure) — for each declared `FieldSchema` (`field`/`type`/`required`), a `null`/`undefined` value on a required field is an error; a present value whose runtime type doesn't match `field.type` (`string`/`number`/`boolean`/`object`/`array`) is an error. `0`, `''`, and `false` are all treated as present, never as missing.
- **`normalizeResponse()`** (pure) — a fixed success/error envelope: `{ success: true, data, meta }` or `{ success: false, error: { message }, meta }`, where `meta` always carries `correlationId` and `timestamp`.
- **`registerSchema()` / `validate()`** — persist and apply request- or response-kind schemas. Throws `ValidationSchemaNotFoundError` for an unknown schema.

---

## Request Context, Correlation IDs

`context/engine.impl.ts`'s `createRequestContextEngine()` implements one tracked record per request:

- **`generateCorrelationId()`** — a real RFC 4122 UUID via `crypto.randomUUID()` — no counter, no predictable sequence.
- **`createContext()`** — starts a context at `status: 'in_flight'`, keyed by its own correlation id.
- **`completeContext()` / `rejectContext()`** — terminal transitions recording `statusCode` or a `rejectionReason` plus `completedAt`. Throw `RequestContextNotFoundError` for an unknown context.

---

## Request Metrics, Health Endpoints

`metrics/engine.impl.ts`'s `createMetricsEngine()` implements immutable metric records and deterministic health aggregation:

- **`computeAverageDurationMs()`** (pure) — mean `durationMs` across a metric list, rounded to the nearest whole millisecond; `0` for an empty list.
- **`computeErrorRate()`** (pure) — fraction of `statusCode >= 400` requests, rounded to 4 decimal places; `0` for an empty list.
- **`recordRequestMetric()`** — appends one immutable `RequestMetric`.
- **`recordHealthCheck()` / `getLatestServiceHealth()` / `getOverallHealth()`** — per-service health snapshots; `getOverallHealth()` considers only the latest snapshot per service (by `checkedAt`), reporting overall `healthy` plus the list of currently-unhealthy service names.

---

## Service Discovery

`discovery/engine.impl.ts`'s `createServiceDiscoveryEngine()` implements the registry of backend services the Runtime Dispatcher is allowed to route to:

- **`registerService()`** — idempotent: registering an already-registered service returns the existing record unchanged (it does **not** reset status back to `'available'`).
- **`markAvailable()` / `markUnavailable()`** — toggle `status`. Throw `ServiceRegistrationNotFoundError` for a never-registered service.
- **`isAvailable()`** — `false` for a service that was never registered, not an error.

---

## OpenAPI Model, API Documentation Model

`documentation/engine.impl.ts`'s `createDocumentationEngine()` implements two pure projections derived entirely from live Registry data — never hand-maintained separately, never generated by a model:

- **`buildOpenApiDocument()`** (pure) — a minimal OpenAPI 3.0.3-shaped document; `operationId` is deterministically derived from method + path (e.g. `GET /crm/customers` → `get_crm_customers`).
- **`buildApiDocumentationModel()`** (pure) — the same underlying data, shaped for direct human-readable rendering (`apiCode`, `apiName`, `version`, `endpoints[].routes[]`).
- **`generateOpenApiDocument()` / `generateApiDocumentation()`** — load the live projection (throwing `ApiNotFoundError`/`ApiVersionNotFoundError` for unknown ids) and apply the pure builder.

---

## Runtime Dispatcher

`dispatcher/engine.impl.ts`'s `createDispatcherEngine()` implements the API Gateway's central request pipeline — composed over every other engine plus the Relationship Layer, in strict deterministic order:

1. **Open Request Context** — `requestContext.createContext()`; publishes `request.received`.
2. **Route Registry lookup** — `registry.findRouteByMethodAndPath()`; `404 route_not_found` if none.
3. **Service Discovery check** — `discovery.isAvailable(route.targetService)`; `503 service_unavailable` if not.
4. **Authentication** (only if `route.requiresAuth`) — `authentication.authenticateRequest()`; `401 <reason>` if not authenticated. An `'apikey'` principal contributes its `scopes` to authorization; a `'jwt'` principal's `id` is its `sub` claim.
5. **Authorization / Policy Evaluation** — `authorization.evaluate()`; `403 policy_denied` on `deny`.
6. **Rate Limiting** (only if `route.rateLimitPolicyId` is set) — `rateLimit.checkAndConsume()`; `429 rate_limit_exceeded` if exceeded.
7. **Request Validation** (only if `route.requestSchemaId` is set) — `validation.validate()`; `400 validation_failed: <errors>` if invalid.
8. **Invoke** — `dispatcher/invoker-map.ts`'s fixed `buildInvokerMap()` table, keyed by `${targetService}:${targetOperation}`; `502 unknown_target_operation` if the route targets an operation outside the fixed 16-entry table.
9. **Response Normalization** — `validation`'s `normalizeResponse()` shape, embedded directly in the returned `DispatchResult`.
10. **Close Request Context** — `requestContext.completeContext()` (success) or `.rejectContext()` (any rejection branch); publishes `request.completed` or `request.rejected`.
11. **Request Metrics** — `metrics.recordRequestMetric()`, with `durationMs` computed from the context's `startedAt` to the completion timestamp.
12. **Return** — a `DispatchResult` (`statusCode`, `body`, `correlationId`) — a plain data object; translating it into a real HTTP response is the job of an adapter outside this package.

Every rejection branch (steps 2–7) shares one internal `reject()` helper, so every failure path is guaranteed to close the request context, publish `request.rejected`, and record a metric — there is no silent-drop failure mode.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 16 required packages, each exclusively through its public runtime API:

- **`getAgentContext()`** — real AI Runtime `RuntimeQueries.findAgent()`.
- **`raiseGatewayApprovalWorkflow()`** — real Workflow Engine `defineWorkflow()` (idempotent per `(organization, requestType)`, cached) + `startWorkflow()`.
- **`getCustomerContext()`** — real CRM Engine `customers.get()`.
- **`getOpportunityContext()`** — real Sales Engine `opportunities.get()`.
- **`getCampaignsContext()`** — real Marketing Engine `queries.findCampaigns()`.
- **`notifyGatewayEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`getChartOfAccountsContext()`** — real Finance Engine `chartOfAccounts.list()`.
- **`getEmployeeContext()`** — real HR Engine `employees.get()`.
- **`getInventoryItemContext()`** — real Inventory Engine `catalog.get()`.
- **`getProjectContext()`** — real Project Management Engine `projects.get()`.
- **`getCustomerSuccessContext()`** — real Customer Success Engine `customers.findByCustomer()`.
- **`recordGatewayMetric()`** — real Analytics Engine `metrics.recordGauge()`.
- **`getObservabilityHealthContext()`** — real Observability Engine `queries.findHealth()`.
- **`getSecurityPolicyContext()`** — real AI Security Engine `queries.findPolicies()`.
- **`getGovernancePolicyContext()`** — real AI Governance Engine `queries.findPolicies()`.
- **`getComplianceFrameworkContext()`** — real AI Compliance Engine `queries.findFrameworks()`.

Every method degrades to a documented `null`/`[]` when its collaborator was not injected, so the API Gateway remains fully usable — and fully tested — completely offline.

`dispatcher/invoker-map.ts`'s `buildInvokerMap()` maps each of these 16 methods to a fixed `${targetService}:${targetOperation}` key, so a `Route` registered with, say, `targetService: 'crm-engine', targetOperation: 'getCustomerContext'` genuinely invokes `relationships.getCustomerContext()` under the hood when dispatched — never reflection, never a dynamically-constructed call.
