/**
 * Real Traversal Engine — BFS, DFS, shortest path, cycle detection, and
 * dependency ordering, backed by the pure algorithms in
 * `graph/algorithms.ts` and data pulled from the real {@link GraphRepository}.
 *
 * @module traversal/engine.impl
 */
import { bfs as bfsAlgorithm, dfs as dfsAlgorithm, dependencyOrder as dependencyOrderAlgorithm, detectCycles as detectCyclesAlgorithm } from '../graph/algorithms.js';
import type { DomainRelationshipType, GraphNode } from '../graph/types.js';
import type { GraphPathResult, GraphRepository } from '../store/graph-repository.js';
import type { DomainGraphId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';

export interface TraversalRunOptions {
  readonly maxDepth?: number;
  readonly relationshipTypes?: readonly DomainRelationshipType[];
}

export interface DependencyOrderOptions {
  readonly relationshipTypes?: readonly DomainRelationshipType[];
}

export interface TraversalEngine {
  bfs(organizationId: OrganizationId, graphId: DomainGraphId, startNodeId: GraphNodeId, options?: TraversalRunOptions): Promise<readonly GraphNode[]>;
  dfs(organizationId: OrganizationId, graphId: DomainGraphId, startNodeId: GraphNodeId, options?: TraversalRunOptions): Promise<readonly GraphNode[]>;
  shortestPath(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
  ): Promise<GraphPathResult | null>;
  detectCycles(organizationId: OrganizationId, graphId: DomainGraphId, options?: DependencyOrderOptions): Promise<readonly (readonly GraphNodeId[])[]>;
  /** Deterministic topological order. Throws `CyclicDependencyError` if the (filtered) graph is cyclic. */
  dependencyOrder(organizationId: OrganizationId, graphId: DomainGraphId, options?: DependencyOrderOptions): Promise<readonly GraphNode[]>;
}

/** Creates a real {@link TraversalEngine} over a {@link GraphRepository}. */
export function createTraversalEngine(graphRepository: GraphRepository): TraversalEngine {
  async function loadGraphData(organizationId: OrganizationId, graphId: DomainGraphId) {
    const entities = await graphRepository.findEntities(organizationId, graphId);
    const relationships = await graphRepository.findRelationships(organizationId, graphId);
    return { entities, relationships };
  }

  function toNodes(entities: readonly GraphNode[], nodeIds: readonly GraphNodeId[]): readonly GraphNode[] {
    const byId = new Map(entities.map((entity) => [entity.nodeId, entity]));
    return nodeIds.map((nodeId) => byId.get(nodeId)).filter((node): node is GraphNode => node !== undefined);
  }

  return {
    async bfs(organizationId, graphId, startNodeId, options = {}) {
      const { entities, relationships } = await loadGraphData(organizationId, graphId);
      const order = bfsAlgorithm(
        entities.map((entity) => entity.nodeId),
        relationships,
        startNodeId,
        options,
      );
      return toNodes(entities, order);
    },

    async dfs(organizationId, graphId, startNodeId, options = {}) {
      const { entities, relationships } = await loadGraphData(organizationId, graphId);
      const order = dfsAlgorithm(
        entities.map((entity) => entity.nodeId),
        relationships,
        startNodeId,
        options,
      );
      return toNodes(entities, order);
    },

    async shortestPath(organizationId, graphId, sourceNodeId, targetNodeId) {
      return graphRepository.shortestPath(organizationId, graphId, sourceNodeId, targetNodeId);
    },

    async detectCycles(organizationId, graphId, options = {}) {
      const { entities, relationships } = await loadGraphData(organizationId, graphId);
      return detectCyclesAlgorithm(
        entities.map((entity) => entity.nodeId),
        relationships,
        options,
      );
    },

    async dependencyOrder(organizationId, graphId, options = {}) {
      const { entities, relationships } = await loadGraphData(organizationId, graphId);
      const order = dependencyOrderAlgorithm(
        entities.map((entity) => entity.nodeId),
        relationships,
        options,
      );
      return toNodes(entities, order);
    },
  };
}
