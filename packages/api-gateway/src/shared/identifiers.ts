/**
 * Identifier types for the API Gateway bounded context.
 *
 * Sibling-owned entities referenced by this package (agents,
 * customers, opportunities, campaigns, employees, inventory items,
 * projects, health checks, security/governance/compliance policies)
 * are addressed by plain `string` foreign keys — this package never
 * redefines another package's identifier namespace.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** API Registry. */
export type ApiId = Identifier;
export type ApiVersionId = Identifier;
export type EndpointId = Identifier;
export type RouteId = Identifier;

/** Middleware Pipeline. */
export type MiddlewareStepId = Identifier;

/** Authentication. */
export type ApiKeyId = Identifier;

/** Authorization. */
export type PolicyId = Identifier;

/** Rate Limiting / Quota Management. */
export type RateLimitPolicyId = Identifier;
export type RateLimitCounterId = Identifier;
export type QuotaId = Identifier;

/** Validation. */
export type ValidationSchemaId = Identifier;

/** Request Context. */
export type RequestContextId = Identifier;

/** Metrics / Health. */
export type RequestMetricId = Identifier;
export type HealthSnapshotId = Identifier;

/** Service Discovery. */
export type ServiceRegistrationId = Identifier;
