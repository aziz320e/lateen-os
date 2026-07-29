/** @module events/gateway-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type ApiRegisteredEvent = DomainEvent<
  'api.registered',
  { readonly organizationId: string; readonly apiId: string; readonly code: string }
>;

export type RouteRegisteredEvent = DomainEvent<
  'route.registered',
  { readonly organizationId: string; readonly routeId: string; readonly method: string; readonly path: string }
>;

export type VersionPublishedEvent = DomainEvent<
  'version.published',
  { readonly organizationId: string; readonly versionId: string; readonly apiId: string; readonly version: string }
>;

export type ApiKeyIssuedEvent = DomainEvent<
  'apikey.issued',
  { readonly organizationId: string; readonly apiKeyId: string; readonly name: string }
>;

export type ApiKeyRevokedEvent = DomainEvent<
  'apikey.revoked',
  { readonly organizationId: string; readonly apiKeyId: string }
>;

export type RequestReceivedEvent = DomainEvent<
  'request.received',
  { readonly organizationId: string; readonly correlationId: string; readonly method: string; readonly path: string }
>;

export type RequestCompletedEvent = DomainEvent<
  'request.completed',
  { readonly organizationId: string; readonly correlationId: string; readonly statusCode: number }
>;

export type RequestRejectedEvent = DomainEvent<
  'request.rejected',
  { readonly organizationId: string; readonly correlationId: string; readonly reason: string }
>;

export type RateLimitExceededEvent = DomainEvent<
  'ratelimit.exceeded',
  { readonly organizationId: string; readonly policyId: string; readonly principalId: string }
>;

export type QuotaExceededEvent = DomainEvent<
  'quota.exceeded',
  { readonly organizationId: string; readonly quotaId: string; readonly principalId: string }
>;

/** Canonical event names for external subscribers. */
export const GATEWAY_EVENT_NAMES = {
  ApiRegistered: 'api.registered',
  RouteRegistered: 'route.registered',
  VersionPublished: 'version.published',
  ApiKeyIssued: 'apikey.issued',
  ApiKeyRevoked: 'apikey.revoked',
  RequestReceived: 'request.received',
  RequestCompleted: 'request.completed',
  RequestRejected: 'request.rejected',
  RateLimitExceeded: 'ratelimit.exceeded',
  QuotaExceeded: 'quota.exceeded',
} as const;

/** Union of all API Gateway domain events. */
export type GatewayDomainEvent =
  | ApiRegisteredEvent
  | RouteRegisteredEvent
  | VersionPublishedEvent
  | ApiKeyIssuedEvent
  | ApiKeyRevokedEvent
  | RequestReceivedEvent
  | RequestCompletedEvent
  | RequestRejectedEvent
  | RateLimitExceededEvent
  | QuotaExceededEvent;
