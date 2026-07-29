/** @module queries/gateway-queries */
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
  SearchGatewayQuery,
  SearchGatewayResult,
} from './types.js';

/** Real, read-only API Gateway query port. */
export interface GatewayQueries {
  findApis(query: FindApisQuery): Promise<FindApisResult>;
  findRoutes(query: FindRoutesQuery): Promise<FindRoutesResult>;
  findApiKeys(query: FindApiKeysQuery): Promise<FindApiKeysResult>;
  findPolicies(query: FindPoliciesQuery): Promise<FindPoliciesResult>;
  findRequestContexts(query: FindRequestContextsQuery): Promise<FindRequestContextsResult>;
  findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult>;
  findHealthSnapshots(query: FindHealthSnapshotsQuery): Promise<FindHealthSnapshotsResult>;
  findServices(query: FindServicesQuery): Promise<FindServicesResult>;
  searchGateway(query: SearchGatewayQuery): Promise<SearchGatewayResult>;
}
