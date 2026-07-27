/**
 * Real {@link DomainGraphQueries} implementation — a CQRS read layer
 * composed over the Graph Repository, Search engine, and Traversal Engine.
 * Repositories are taken as constructor dependencies but never returned
 * to callers.
 *
 * @module queries/domain-graph-queries.impl
 */
import type { GraphSearchEngine } from '../search/engine.impl.js';
import type { GraphRepository } from '../store/graph-repository.js';
import type { TraversalEngine } from '../traversal/engine.impl.js';
import type { DomainGraphQueries } from './domain-graph-queries.js';
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

export interface DomainGraphQueriesDeps {
  readonly graphRepository: GraphRepository;
  readonly searchEngine: GraphSearchEngine;
  readonly traversalEngine: TraversalEngine;
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

/** Creates a real {@link DomainGraphQueries} read port over the given repository and engines. */
export function createDomainGraphQueries(deps: DomainGraphQueriesDeps): DomainGraphQueries {
  return {
    async findEntity(query: FindEntityQuery): Promise<FindEntityResult> {
      return { entity: await deps.graphRepository.findEntity(query.organizationId, query.graphId, query.nodeId) };
    },

    async searchEntities(params: SearchEntitiesParams): Promise<SearchEntitiesResult> {
      const matches = await deps.searchEngine.search(params.organizationId, params.graphId, params);
      return { matches, total: matches.length };
    },

    async findRelationships(query: FindRelationshipsQuery): Promise<FindRelationshipsResult> {
      const relationships = await deps.graphRepository.findRelationships(query.organizationId, query.graphId, query);
      return { relationships, total: relationships.length };
    },

    async findNeighbors(query: FindNeighborsQuery): Promise<FindNeighborsResult> {
      const neighbors = await deps.graphRepository.findNeighbors(query.organizationId, query.graphId, query.nodeId, query.direction);
      return { neighbors };
    },

    async shortestPath(query: ShortestPathQuery): Promise<ShortestPathQueryResult> {
      const path = await deps.graphRepository.shortestPath(query.organizationId, query.graphId, query.sourceNodeId, query.targetNodeId);
      return { path };
    },

    async dependencyOrder(query: DependencyOrderQuery): Promise<DependencyOrderResult> {
      const order = await deps.traversalEngine.dependencyOrder(query.organizationId, query.graphId, {
        relationshipTypes: query.relationshipTypes,
      });
      return { order };
    },

    async detectCycles(query: DetectCyclesQuery): Promise<DetectCyclesResult> {
      const cycles = await deps.traversalEngine.detectCycles(query.organizationId, query.graphId, {
        relationshipTypes: query.relationshipTypes,
      });
      return { cycles };
    },

    async graphStatistics(query: GraphStatisticsQuery): Promise<GraphStatisticsResult> {
      const entities = await deps.graphRepository.findEntities(query.organizationId, query.graphId);
      const relationships = await deps.graphRepository.findRelationships(query.organizationId, query.graphId);
      const components = await deps.graphRepository.connectedComponents(query.organizationId, query.graphId);

      return {
        entityCount: entities.length,
        relationshipCount: relationships.length,
        entityCountsByType: countBy(entities, (entity) => entity.nodeType),
        relationshipCountsByType: countBy(relationships, (relationship) => relationship.relationshipType),
        componentCount: components.length,
      };
    },
  };
}
