/** @module registry/repository */
import type { Repository } from '../shared/repository.js';
import type { ApiId, ApiVersionId, EndpointId, OrganizationId, RouteId } from '../shared/identifiers.js';
import type { HttpMethod } from '../shared/primitives.js';
import type { Api, ApiVersion, Endpoint, Route } from './types.js';

export interface ApiRepository extends Repository<Api, ApiId> {
  findAll(organizationId: OrganizationId): Promise<readonly Api[]>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Api | null>;
}

export interface ApiVersionRepository extends Repository<ApiVersion, ApiVersionId> {
  findAll(organizationId: OrganizationId): Promise<readonly ApiVersion[]>;
  findByApi(organizationId: OrganizationId, apiId: ApiId): Promise<readonly ApiVersion[]>;
}

export interface EndpointRepository extends Repository<Endpoint, EndpointId> {
  findAll(organizationId: OrganizationId): Promise<readonly Endpoint[]>;
  findByApi(organizationId: OrganizationId, apiId: ApiId): Promise<readonly Endpoint[]>;
  findByVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<readonly Endpoint[]>;
}

export interface RouteRepository extends Repository<Route, RouteId> {
  findAll(organizationId: OrganizationId): Promise<readonly Route[]>;
  findByEndpoint(organizationId: OrganizationId, endpointId: EndpointId): Promise<readonly Route[]>;
  findByMethodAndPath(organizationId: OrganizationId, method: HttpMethod, path: string): Promise<Route | null>;
}
