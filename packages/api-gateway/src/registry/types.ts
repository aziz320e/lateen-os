/** @module registry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ApiId, ApiVersionId, EndpointId, RouteId } from '../shared/identifiers.js';
import type { HttpMethod } from '../shared/primitives.js';

export type { ApiId, ApiVersionId, EndpointId, RouteId };

export type ApiStatus = 'active' | 'deprecated' | 'retired';

/** A logical API exposed through the gateway — a named grouping of versions, endpoints, and routes. */
export interface Api extends TenantAuditableEntity<ApiId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly status: ApiStatus;
}

export type ApiVersionStatus = 'draft' | 'published' | 'deprecated' | 'retired';

/** One version of an API (e.g. `"v1"`). */
export interface ApiVersion extends TenantAuditableEntity<ApiVersionId> {
  readonly apiId: ApiId;
  readonly version: string;
  readonly status: ApiVersionStatus;
}

/** A named grouping of routes within one API version. */
export interface Endpoint extends TenantAuditableEntity<EndpointId> {
  readonly apiId: ApiId;
  readonly versionId: ApiVersionId;
  readonly name: string;
  readonly description?: string;
}

/**
 * A single routable method+path, mapped to a real sibling package
 * operation. `targetService`/`targetOperation` are opaque strings
 * resolved only by the Runtime Dispatcher, through the Relationship
 * Layer's curated, named methods — never dynamic reflection.
 */
export interface Route extends TenantAuditableEntity<RouteId> {
  readonly endpointId: EndpointId;
  readonly method: HttpMethod;
  readonly path: string;
  readonly targetService: string;
  readonly targetOperation: string;
  readonly requiresAuth: boolean;
  readonly rateLimitPolicyId?: string;
  readonly requestSchemaId?: string;
}
