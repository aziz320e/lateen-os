/** @module queries/types */
import type { ApiKey, ApiKeyId, ApiKeyStatus } from '../authentication/types.js';
import type { Policy, PolicyEffect, PolicyId } from '../authorization/types.js';
import type { RequestContext, RequestContextId, RequestContextStatus } from '../context/types.js';
import type { HealthSnapshot, HealthSnapshotId, RequestMetric, RequestMetricId } from '../metrics/types.js';
import type { Api, ApiId, ApiStatus, Route, RouteId } from '../registry/types.js';
import type { ServiceRegistration, ServiceRegistrationId, ServiceStatus } from '../discovery/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { HttpMethod } from '../shared/primitives.js';

export interface FindApisQuery extends OrganizationScopedQuery {
  readonly status?: ApiStatus;
}

export interface FindApisResult {
  readonly apis: readonly Api[];
  readonly total: number;
}

export interface FindRoutesQuery extends OrganizationScopedQuery {
  readonly method?: HttpMethod;
  readonly targetService?: string;
}

export interface FindRoutesResult {
  readonly routes: readonly Route[];
  readonly total: number;
}

export interface FindApiKeysQuery extends OrganizationScopedQuery {
  readonly status?: ApiKeyStatus;
}

export interface FindApiKeysResult {
  readonly apiKeys: readonly ApiKey[];
  readonly total: number;
}

export interface FindPoliciesQuery extends OrganizationScopedQuery {
  readonly effect?: PolicyEffect;
}

export interface FindPoliciesResult {
  readonly policies: readonly Policy[];
  readonly total: number;
}

export interface FindRequestContextsQuery extends OrganizationScopedQuery {
  readonly status?: RequestContextStatus;
}

export interface FindRequestContextsResult {
  readonly contexts: readonly RequestContext[];
  readonly total: number;
}

export interface FindMetricsQuery extends OrganizationScopedQuery {
  readonly path?: string;
}

export interface FindMetricsResult {
  readonly metrics: readonly RequestMetric[];
  readonly total: number;
}

export interface FindHealthSnapshotsQuery extends OrganizationScopedQuery {
  readonly serviceName?: string;
}

export interface FindHealthSnapshotsResult {
  readonly snapshots: readonly HealthSnapshot[];
  readonly total: number;
}

export interface FindServicesQuery extends OrganizationScopedQuery {
  readonly status?: ServiceStatus;
}

export interface FindServicesResult {
  readonly services: readonly ServiceRegistration[];
  readonly total: number;
}

export interface SearchGatewayQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchGatewayRecordType = 'api' | 'route';

export interface SearchGatewayMatch {
  readonly recordType: SearchGatewayRecordType;
  readonly id: ApiId | RouteId | ApiKeyId | PolicyId | RequestContextId | RequestMetricId | HealthSnapshotId | ServiceRegistrationId;
  readonly label: string;
  readonly score: number;
}

export interface SearchGatewayResult {
  readonly matches: readonly SearchGatewayMatch[];
  readonly total: number;
}

export type { OrganizationId };
