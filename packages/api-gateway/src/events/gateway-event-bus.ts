/**
 * Real, typed event bus for the API Gateway runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/gateway-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type GatewayEventMap = {
  'api.registered': { readonly organizationId: string; readonly apiId: string; readonly code: string };
  'route.registered': { readonly organizationId: string; readonly routeId: string; readonly method: string; readonly path: string };
  'version.published': { readonly organizationId: string; readonly versionId: string; readonly apiId: string; readonly version: string };
  'apikey.issued': { readonly organizationId: string; readonly apiKeyId: string; readonly name: string };
  'apikey.revoked': { readonly organizationId: string; readonly apiKeyId: string };
  'request.received': { readonly organizationId: string; readonly correlationId: string; readonly method: string; readonly path: string };
  'request.completed': { readonly organizationId: string; readonly correlationId: string; readonly statusCode: number };
  'request.rejected': { readonly organizationId: string; readonly correlationId: string; readonly reason: string };
  'ratelimit.exceeded': { readonly organizationId: string; readonly policyId: string; readonly principalId: string };
  'quota.exceeded': { readonly organizationId: string; readonly quotaId: string; readonly principalId: string };
};

export type GatewayEventBus = EventBus<GatewayEventMap>;

/** Creates an in-memory {@link GatewayEventBus}. */
export function createGatewayEventBus(): GatewayEventBus {
  return createEventBus<GatewayEventMap>();
}
