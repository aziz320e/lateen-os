/** Real, in-memory API/Route/Endpoint/Version registry repositories. @module registry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ApiRepository, ApiVersionRepository, EndpointRepository, RouteRepository } from './repository.js';
import type { Api, ApiVersion, Endpoint, Route } from './types.js';

/** Creates a real, in-memory {@link ApiRepository}. */
export function createApiRepository(seed?: readonly Api[]): ApiRepository {
  const repo = createInMemoryRepository<Api>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((api) => api.code === code) ?? null;
    },
  };
}

/** Creates a real, in-memory {@link ApiVersionRepository}. */
export function createApiVersionRepository(seed?: readonly ApiVersion[]): ApiVersionRepository {
  const repo = createInMemoryRepository<ApiVersion>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByApi(organizationId, apiId) {
      return repo.list(organizationId).filter((version) => version.apiId === apiId);
    },
  };
}

/** Creates a real, in-memory {@link EndpointRepository}. */
export function createEndpointRepository(seed?: readonly Endpoint[]): EndpointRepository {
  const repo = createInMemoryRepository<Endpoint>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByApi(organizationId, apiId) {
      return repo.list(organizationId).filter((endpoint) => endpoint.apiId === apiId);
    },
    async findByVersion(organizationId, versionId) {
      return repo.list(organizationId).filter((endpoint) => endpoint.versionId === versionId);
    },
  };
}

/** Creates a real, in-memory {@link RouteRepository}. */
export function createRouteRepository(seed?: readonly Route[]): RouteRepository {
  const repo = createInMemoryRepository<Route>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEndpoint(organizationId, endpointId) {
      return repo.list(organizationId).filter((route) => route.endpointId === endpointId);
    },
    async findByMethodAndPath(organizationId, method, path) {
      return repo.list(organizationId).find((route) => route.method === method && route.path === path) ?? null;
    },
  };
}
