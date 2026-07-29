/**
 * Real Runtime Dispatcher — the API Gateway's central request
 * pipeline. Composes, in strict deterministic order: Request Context
 * (open) -> Route Registry lookup -> Service Discovery -> Authentication
 * -> Authorization (Policy Evaluation) -> Rate Limiting -> Request
 * Validation -> the fixed Relationship Layer invoker table -> Response
 * Normalization -> Request Metrics -> Request Context (close).
 *
 * No HTTP framework binding anywhere — `DispatchRequestInput` is a
 * plain data object; a real HTTP server adapter (outside this
 * package) would translate an incoming request into this shape and
 * translate `DispatchResult` back into a response.
 *
 * @module dispatcher/engine.impl
 */
import type { AuthenticationEngine } from '../authentication/engine.impl.js';
import type { AuthorizationEngine } from '../authorization/engine.impl.js';
import type { RequestContextEngine } from '../context/engine.impl.js';
import type { ServiceDiscoveryEngine } from '../discovery/engine.impl.js';
import type { GatewayEventBus } from '../events/gateway-event-bus.js';
import type { MetricsEngine } from '../metrics/engine.impl.js';
import type { RateLimitEngine } from '../ratelimit/engine.impl.js';
import type { RegistryEngine } from '../registry/engine.impl.js';
import type { RelationshipManagement } from '../relationship-management/service.impl.js';
import { secondsBetweenIso } from '../shared/date.js';
import { nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { HttpMethod } from '../shared/primitives.js';
import type { NormalizedResponse } from '../validation/engine.impl.js';
import type { ValidationEngine } from '../validation/engine.impl.js';
import { buildInvokerMap, type TargetInvoker } from './invoker-map.js';

export interface DispatchRequestInput {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: Readonly<Record<string, unknown>>;
  readonly apiKey?: string;
  readonly bearerToken?: string;
  readonly jwtSecret?: string;
  readonly principalScopes?: readonly string[];
}

export interface DispatchResult {
  readonly statusCode: number;
  readonly body: NormalizedResponse;
  readonly correlationId: string;
}

export interface DispatcherEngine {
  dispatch(organizationId: OrganizationId, input: DispatchRequestInput): Promise<DispatchResult>;
}

/** Creates a real {@link DispatcherEngine}, composed over every other gateway engine and the Relationship Layer. */
export function createDispatcherEngine(
  registry: Pick<RegistryEngine, 'findRouteByMethodAndPath'>,
  discovery: Pick<ServiceDiscoveryEngine, 'isAvailable'>,
  authentication: Pick<AuthenticationEngine, 'authenticateRequest'>,
  authorization: Pick<AuthorizationEngine, 'evaluate'>,
  rateLimit: Pick<RateLimitEngine, 'checkAndConsume'>,
  validation: Pick<ValidationEngine, 'validate'>,
  requestContext: Pick<RequestContextEngine, 'createContext' | 'completeContext' | 'rejectContext'>,
  metrics: Pick<MetricsEngine, 'recordRequestMetric'>,
  relationships: RelationshipManagement,
  eventBus?: GatewayEventBus,
  now: () => string = nowIso,
): DispatcherEngine {
  const invokerMap: Readonly<Record<string, TargetInvoker>> = buildInvokerMap(relationships);

  return {
    async dispatch(organizationId, input) {
      const context = await requestContext.createContext(organizationId, { method: input.method, path: input.path });
      eventBus?.publish('request.received', { organizationId, correlationId: context.id, method: input.method, path: input.path });

      async function reject(statusCode: number, reason: string): Promise<DispatchResult> {
        await requestContext.rejectContext(organizationId, context.id, reason);
        eventBus?.publish('request.rejected', { organizationId, correlationId: context.id, reason });
        const completedAt = now();
        await metrics.recordRequestMetric(organizationId, {
          correlationId: context.id,
          method: input.method,
          path: input.path,
          statusCode,
          durationMs: Math.max(0, secondsBetweenIso(context.startedAt, completedAt) * 1000),
        });
        return { statusCode, body: { success: false, error: { message: reason }, meta: { correlationId: context.id, timestamp: completedAt } }, correlationId: context.id };
      }

      const route = await registry.findRouteByMethodAndPath(organizationId, input.method, input.path);
      if (!route) return reject(404, 'route_not_found');

      const serviceAvailable = await discovery.isAvailable(organizationId, route.targetService);
      if (!serviceAvailable) return reject(503, 'service_unavailable');

      let principalId = 'anonymous';
      let principalScopes: readonly string[] = input.principalScopes ?? [];

      if (route.requiresAuth) {
        const authResult = await authentication.authenticateRequest(organizationId, { apiKey: input.apiKey, bearerToken: input.bearerToken, jwtSecret: input.jwtSecret });
        if (!authResult.authenticated) return reject(401, authResult.reason);
        if (authResult.principal.type === 'apikey') {
          principalId = authResult.principal.id;
          principalScopes = authResult.principal.scopes;
        } else {
          principalId = String(authResult.principal.payload['sub'] ?? 'jwt-principal');
        }
      }

      const decision = await authorization.evaluate(organizationId, { resource: route.path, action: route.method, principalScopes });
      if (decision.effect === 'deny') return reject(403, 'policy_denied');

      if (route.rateLimitPolicyId) {
        const rateLimitResult = await rateLimit.checkAndConsume(organizationId, route.rateLimitPolicyId, principalId);
        if (rateLimitResult.exceeded) return reject(429, 'rate_limit_exceeded');
      }

      if (route.requestSchemaId) {
        const validationResult = await validation.validate(organizationId, route.requestSchemaId, input.body ?? {});
        if (!validationResult.valid) return reject(400, `validation_failed: ${validationResult.errors.join('; ')}`);
      }

      const invoker = invokerMap[`${route.targetService}:${route.targetOperation}`];
      if (!invoker) return reject(502, 'unknown_target_operation');

      const data = await invoker(organizationId, input.body);

      await requestContext.completeContext(organizationId, context.id, 200);
      eventBus?.publish('request.completed', { organizationId, correlationId: context.id, statusCode: 200 });
      const completedAt = now();
      await metrics.recordRequestMetric(organizationId, {
        correlationId: context.id,
        method: input.method,
        path: input.path,
        statusCode: 200,
        durationMs: Math.max(0, secondsBetweenIso(context.startedAt, completedAt) * 1000),
      });

      return { statusCode: 200, body: { success: true, data, meta: { correlationId: context.id, timestamp: completedAt } }, correlationId: context.id };
    },
  };
}
