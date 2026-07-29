/**
 * Real Registry engine — API Registry, Version Registry, Endpoint
 * Registry, and Route Registry, guarded by simple, deterministic
 * status lifecycles.
 *
 * @module registry/engine.impl
 */
import type { GatewayEventBus } from '../events/gateway-event-bus.js';
import {
  ApiNotFoundError,
  ApiVersionNotFoundError,
  DuplicateRouteError,
  EndpointNotFoundError,
  InvalidApiTransitionError,
  InvalidApiVersionTransitionError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ApiId, ApiVersionId, EndpointId, OrganizationId, RouteId } from '../shared/identifiers.js';
import type { HttpMethod } from '../shared/primitives.js';
import type { ApiRepository, ApiVersionRepository, EndpointRepository, RouteRepository } from './repository.js';
import type { Api, ApiStatus, ApiVersion, ApiVersionStatus, Endpoint, Route } from './types.js';

const API_TRANSITIONS: Readonly<Record<ApiStatus, readonly ApiStatus[]>> = {
  active: ['deprecated', 'retired'],
  deprecated: ['retired', 'active'],
  retired: [],
};

/** Whether an API may transition from one status to another. */
export function canTransitionApi(from: ApiStatus, to: ApiStatus): boolean {
  return API_TRANSITIONS[from].includes(to);
}

const API_VERSION_TRANSITIONS: Readonly<Record<ApiVersionStatus, readonly ApiVersionStatus[]>> = {
  draft: ['published'],
  published: ['deprecated'],
  deprecated: ['retired'],
  retired: [],
};

/** Whether an API version may transition from one status to another. */
export function canTransitionApiVersion(from: ApiVersionStatus, to: ApiVersionStatus): boolean {
  return API_VERSION_TRANSITIONS[from].includes(to);
}

export interface RegisterApiInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

export interface CreateApiVersionInput {
  readonly apiId: ApiId;
  readonly version: string;
}

export interface RegisterEndpointInput {
  readonly apiId: ApiId;
  readonly versionId: ApiVersionId;
  readonly name: string;
  readonly description?: string;
}

export interface RegisterRouteInput {
  readonly endpointId: EndpointId;
  readonly method: HttpMethod;
  readonly path: string;
  readonly targetService: string;
  readonly targetOperation: string;
  readonly requiresAuth?: boolean;
  readonly rateLimitPolicyId?: string;
  readonly requestSchemaId?: string;
}

export interface RegistryEngine {
  registerApi(organizationId: OrganizationId, input: RegisterApiInput): Promise<Api>;
  deprecateApi(organizationId: OrganizationId, apiId: ApiId): Promise<Api>;
  reactivateApi(organizationId: OrganizationId, apiId: ApiId): Promise<Api>;
  retireApi(organizationId: OrganizationId, apiId: ApiId): Promise<Api>;
  getApi(organizationId: OrganizationId, apiId: ApiId): Promise<Api | null>;
  listApis(organizationId: OrganizationId): Promise<readonly Api[]>;
  findApiByCode(organizationId: OrganizationId, code: string): Promise<Api | null>;

  createVersion(organizationId: OrganizationId, input: CreateApiVersionInput): Promise<ApiVersion>;
  publishVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<ApiVersion>;
  deprecateVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<ApiVersion>;
  retireVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<ApiVersion>;
  getVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<ApiVersion | null>;
  listVersionsForApi(organizationId: OrganizationId, apiId: ApiId): Promise<readonly ApiVersion[]>;

  registerEndpoint(organizationId: OrganizationId, input: RegisterEndpointInput): Promise<Endpoint>;
  getEndpoint(organizationId: OrganizationId, endpointId: EndpointId): Promise<Endpoint | null>;
  listEndpointsForVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<readonly Endpoint[]>;

  registerRoute(organizationId: OrganizationId, input: RegisterRouteInput): Promise<Route>;
  getRoute(organizationId: OrganizationId, routeId: RouteId): Promise<Route | null>;
  listRoutesForEndpoint(organizationId: OrganizationId, endpointId: EndpointId): Promise<readonly Route[]>;
  findRouteByMethodAndPath(organizationId: OrganizationId, method: HttpMethod, path: string): Promise<Route | null>;
  listAllRoutes(organizationId: OrganizationId): Promise<readonly Route[]>;
}

/** Creates a real {@link RegistryEngine}. */
export function createRegistryEngine(
  apiRepository: ApiRepository,
  versionRepository: ApiVersionRepository,
  endpointRepository: EndpointRepository,
  routeRepository: RouteRepository,
  eventBus?: GatewayEventBus,
  now: () => string = nowIso,
): RegistryEngine {
  async function requireApi(organizationId: OrganizationId, apiId: ApiId): Promise<Api> {
    const api = await apiRepository.findById(organizationId, apiId);
    if (!api) throw new ApiNotFoundError(apiId);
    return api;
  }

  async function requireVersion(organizationId: OrganizationId, versionId: ApiVersionId): Promise<ApiVersion> {
    const version = await versionRepository.findById(organizationId, versionId);
    if (!version) throw new ApiVersionNotFoundError(versionId);
    return version;
  }

  async function transitionApi(organizationId: OrganizationId, apiId: ApiId, to: ApiStatus): Promise<Api> {
    const api = await requireApi(organizationId, apiId);
    if (!canTransitionApi(api.status, to)) {
      throw new InvalidApiTransitionError(apiId, api.status, to);
    }
    const updated: Api = { ...api, status: to, updatedAt: now() };
    await apiRepository.save(updated);
    return updated;
  }

  async function transitionVersion(organizationId: OrganizationId, versionId: ApiVersionId, to: ApiVersionStatus): Promise<ApiVersion> {
    const version = await requireVersion(organizationId, versionId);
    if (!canTransitionApiVersion(version.status, to)) {
      throw new InvalidApiVersionTransitionError(versionId, version.status, to);
    }
    const updated: ApiVersion = { ...version, status: to, updatedAt: now() };
    await versionRepository.save(updated);
    return updated;
  }

  return {
    async registerApi(organizationId, input) {
      const timestamp = now();
      const api: Api = {
        id: generateId('gateway-api'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        status: 'active',
      };
      await apiRepository.save(api);
      eventBus?.publish('api.registered', { organizationId, apiId: api.id, code: api.code });
      return api;
    },

    async deprecateApi(organizationId, apiId) {
      return transitionApi(organizationId, apiId, 'deprecated');
    },

    async reactivateApi(organizationId, apiId) {
      return transitionApi(organizationId, apiId, 'active');
    },

    async retireApi(organizationId, apiId) {
      return transitionApi(organizationId, apiId, 'retired');
    },

    async getApi(organizationId, apiId) {
      return apiRepository.findById(organizationId, apiId);
    },

    async listApis(organizationId) {
      return apiRepository.findAll(organizationId);
    },

    async findApiByCode(organizationId, code) {
      return apiRepository.findByCode(organizationId, code);
    },

    async createVersion(organizationId, input) {
      await requireApi(organizationId, input.apiId);
      const timestamp = now();
      const version: ApiVersion = {
        id: generateId('gateway-api-version'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        apiId: input.apiId,
        version: input.version,
        status: 'draft',
      };
      await versionRepository.save(version);
      return version;
    },

    async publishVersion(organizationId, versionId) {
      const updated = await transitionVersion(organizationId, versionId, 'published');
      eventBus?.publish('version.published', { organizationId, versionId, apiId: updated.apiId, version: updated.version });
      return updated;
    },

    async deprecateVersion(organizationId, versionId) {
      return transitionVersion(organizationId, versionId, 'deprecated');
    },

    async retireVersion(organizationId, versionId) {
      return transitionVersion(organizationId, versionId, 'retired');
    },

    async getVersion(organizationId, versionId) {
      return versionRepository.findById(organizationId, versionId);
    },

    async listVersionsForApi(organizationId, apiId) {
      return versionRepository.findByApi(organizationId, apiId);
    },

    async registerEndpoint(organizationId, input) {
      await requireApi(organizationId, input.apiId);
      await requireVersion(organizationId, input.versionId);
      const timestamp = now();
      const endpoint: Endpoint = {
        id: generateId('gateway-endpoint'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        apiId: input.apiId,
        versionId: input.versionId,
        name: input.name,
        description: input.description,
      };
      await endpointRepository.save(endpoint);
      return endpoint;
    },

    async getEndpoint(organizationId, endpointId) {
      return endpointRepository.findById(organizationId, endpointId);
    },

    async listEndpointsForVersion(organizationId, versionId) {
      return endpointRepository.findByVersion(organizationId, versionId);
    },

    async registerRoute(organizationId, input) {
      const endpoint = await endpointRepository.findById(organizationId, input.endpointId);
      if (!endpoint) throw new EndpointNotFoundError(input.endpointId);

      const existing = await routeRepository.findByMethodAndPath(organizationId, input.method, input.path);
      if (existing) throw new DuplicateRouteError(input.method, input.path);

      const timestamp = now();
      const route: Route = {
        id: generateId('gateway-route'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        endpointId: input.endpointId,
        method: input.method,
        path: input.path,
        targetService: input.targetService,
        targetOperation: input.targetOperation,
        requiresAuth: input.requiresAuth ?? true,
        rateLimitPolicyId: input.rateLimitPolicyId,
        requestSchemaId: input.requestSchemaId,
      };
      await routeRepository.save(route);
      eventBus?.publish('route.registered', { organizationId, routeId: route.id, method: route.method, path: route.path });
      return route;
    },

    async getRoute(organizationId, routeId) {
      return routeRepository.findById(organizationId, routeId);
    },

    async listRoutesForEndpoint(organizationId, endpointId) {
      return routeRepository.findByEndpoint(organizationId, endpointId);
    },

    async findRouteByMethodAndPath(organizationId, method, path) {
      return routeRepository.findByMethodAndPath(organizationId, method, path);
    },

    async listAllRoutes(organizationId) {
      return routeRepository.findAll(organizationId);
    },
  };
}
