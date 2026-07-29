/**
 * Real {@link GatewayQueries} implementation — a CQRS read layer
 * composed over the API Gateway repositories. Repositories are taken
 * as constructor dependencies but never returned to callers.
 *
 * @module queries/gateway-queries.impl
 */
import type { ApiKeyRepository } from '../authentication/repository.js';
import type { PolicyRepository } from '../authorization/repository.js';
import type { RequestContextRepository } from '../context/repository.js';
import type { ServiceRegistrationRepository } from '../discovery/repository.js';
import type { HealthSnapshotRepository, RequestMetricRepository } from '../metrics/repository.js';
import type { ApiRepository, RouteRepository } from '../registry/repository.js';
import type { GatewayQueries } from './gateway-queries.js';
import type {
  FindApiKeysQuery,
  FindApiKeysResult,
  FindApisQuery,
  FindApisResult,
  FindHealthSnapshotsQuery,
  FindHealthSnapshotsResult,
  FindMetricsQuery,
  FindMetricsResult,
  FindPoliciesQuery,
  FindPoliciesResult,
  FindRequestContextsQuery,
  FindRequestContextsResult,
  FindRoutesQuery,
  FindRoutesResult,
  FindServicesQuery,
  FindServicesResult,
  SearchGatewayMatch,
  SearchGatewayQuery,
  SearchGatewayResult,
} from './types.js';

export interface GatewayQueriesDeps {
  readonly apiRepository: ApiRepository;
  readonly routeRepository: RouteRepository;
  readonly apiKeyRepository: ApiKeyRepository;
  readonly policyRepository: PolicyRepository;
  readonly requestContextRepository: RequestContextRepository;
  readonly requestMetricRepository: RequestMetricRepository;
  readonly healthSnapshotRepository: HealthSnapshotRepository;
  readonly serviceRegistrationRepository: ServiceRegistrationRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link GatewayQueries} read port over the given repositories. */
export function createGatewayQueries(deps: GatewayQueriesDeps): GatewayQueries {
  return {
    async findApis(query: FindApisQuery): Promise<FindApisResult> {
      let apis = await deps.apiRepository.findAll(query.organizationId);
      if (query.status) apis = apis.filter((api) => api.status === query.status);
      return { apis: paginate(apis, query.offset, query.limit), total: apis.length };
    },

    async findRoutes(query: FindRoutesQuery): Promise<FindRoutesResult> {
      let routes = await deps.routeRepository.findAll(query.organizationId);
      if (query.method) routes = routes.filter((route) => route.method === query.method);
      if (query.targetService) routes = routes.filter((route) => route.targetService === query.targetService);
      return { routes: paginate(routes, query.offset, query.limit), total: routes.length };
    },

    async findApiKeys(query: FindApiKeysQuery): Promise<FindApiKeysResult> {
      let apiKeys = await deps.apiKeyRepository.findAll(query.organizationId);
      if (query.status) apiKeys = apiKeys.filter((apiKey) => apiKey.status === query.status);
      return { apiKeys: paginate(apiKeys, query.offset, query.limit), total: apiKeys.length };
    },

    async findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult> {
      let policies = await deps.policyRepository.findAll(query.organizationId);
      if (query.effect) policies = policies.filter((policy) => policy.effect === query.effect);
      return { policies: paginate(policies, query.offset, query.limit), total: policies.length };
    },

    async findRequestContexts(query: FindRequestContextsQuery): Promise<FindRequestContextsResult> {
      let contexts = await deps.requestContextRepository.findAll(query.organizationId);
      if (query.status) contexts = contexts.filter((context) => context.status === query.status);
      return { contexts: paginate(contexts, query.offset, query.limit), total: contexts.length };
    },

    async findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult> {
      const metrics = query.path
        ? await deps.requestMetricRepository.findByPath(query.organizationId, query.path)
        : await deps.requestMetricRepository.findAll(query.organizationId);
      return { metrics: paginate(metrics, query.offset, query.limit), total: metrics.length };
    },

    async findHealthSnapshots(query: FindHealthSnapshotsQuery): Promise<FindHealthSnapshotsResult> {
      const snapshots = query.serviceName
        ? await deps.healthSnapshotRepository.findByService(query.organizationId, query.serviceName)
        : await deps.healthSnapshotRepository.findAll(query.organizationId);
      return { snapshots: paginate(snapshots, query.offset, query.limit), total: snapshots.length };
    },

    async findServices(query: FindServicesQuery): Promise<FindServicesResult> {
      let services = await deps.serviceRegistrationRepository.findAll(query.organizationId);
      if (query.status) services = services.filter((service) => service.status === query.status);
      return { services: paginate(services, query.offset, query.limit), total: services.length };
    },

    async searchGateway(query: SearchGatewayQuery): Promise<SearchGatewayResult> {
      const [apis, routes] = await Promise.all([
        deps.apiRepository.findAll(query.organizationId),
        deps.routeRepository.findAll(query.organizationId),
      ]);

      const matches: SearchGatewayMatch[] = [];
      for (const api of apis) {
        const score = Math.max(scoreLabel(api.name, query.keyword), scoreLabel(api.code, query.keyword));
        if (score > 0) matches.push({ recordType: 'api', id: api.id, label: api.name, score });
      }
      for (const route of routes) {
        const score = scoreLabel(route.path, query.keyword);
        if (score > 0) matches.push({ recordType: 'route', id: route.id, label: route.path, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
