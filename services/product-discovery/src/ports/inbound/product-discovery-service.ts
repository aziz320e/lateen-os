/** @module ports/inbound/product-discovery-service */
import type { DiscoveryRunId, OrganizationId } from '../../domain/identifiers.js';
import type { ProductDiscoveryRun } from '../../domain/discovery-run.js';
import type { DiscoveryRecommendation } from '../../domain/discovery-recommendation.js';

export interface RunProductDiscoveryCommand {
  readonly organizationId: OrganizationId;
  readonly keywords?: readonly string[];
  readonly sources?: readonly string[];
  readonly runtimeAgentId?: string;
}

export interface GetDiscoveryRunQuery {
  readonly organizationId: OrganizationId;
  readonly runId: DiscoveryRunId;
}

export interface ListDiscoveryRecommendationsQuery {
  readonly organizationId: OrganizationId;
  readonly runId?: DiscoveryRunId;
  readonly limit?: number;
}

export interface ListDiscoveryRunsQuery {
  readonly organizationId: OrganizationId;
}

/** Primary inbound port — Product Discovery Platform service. */
export interface ProductDiscoveryService {
  runDiscovery(command: RunProductDiscoveryCommand): Promise<ProductDiscoveryRun>;

  getRun(query: GetDiscoveryRunQuery): Promise<ProductDiscoveryRun | null>;

  listRuns(query: ListDiscoveryRunsQuery): Promise<readonly ProductDiscoveryRun[]>;

  listRecommendations(
    query: ListDiscoveryRecommendationsQuery,
  ): Promise<readonly DiscoveryRecommendation[]>;
}
