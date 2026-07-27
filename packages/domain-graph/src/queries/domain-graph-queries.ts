/** @module queries/domain-graph-queries */
import type {
  DependencyOrderQuery,
  DependencyOrderResult,
  DetectCyclesQuery,
  DetectCyclesResult,
  FindEntityQuery,
  FindEntityResult,
  FindNeighborsQuery,
  FindNeighborsResult,
  FindRelationshipsQuery,
  FindRelationshipsResult,
  GraphStatisticsQuery,
  GraphStatisticsResult,
  SearchEntitiesParams,
  SearchEntitiesResult,
  ShortestPathQuery,
  ShortestPathQueryResult,
} from './runtime-types.js';

/**
 * Real-time read-side query port for the Domain Graph runtime. Composed
 * purely over the Graph Repository, Search engine, and Traversal Engine —
 * never exposes a repository directly.
 */
export interface DomainGraphQueries {
  findEntity(query: FindEntityQuery): Promise<FindEntityResult>;

  searchEntities(params: SearchEntitiesParams): Promise<SearchEntitiesResult>;

  findRelationships(query: FindRelationshipsQuery): Promise<FindRelationshipsResult>;

  findNeighbors(query: FindNeighborsQuery): Promise<FindNeighborsResult>;

  shortestPath(query: ShortestPathQuery): Promise<ShortestPathQueryResult>;

  dependencyOrder(query: DependencyOrderQuery): Promise<DependencyOrderResult>;

  detectCycles(query: DetectCyclesQuery): Promise<DetectCyclesResult>;

  graphStatistics(query: GraphStatisticsQuery): Promise<GraphStatisticsResult>;
}
