/**
 * Real {@link GraphRepository} implementation — composes the internal
 * {@link EntityRepository} and {@link RelationshipRepository}, reusing the
 * pure algorithms in `graph/algorithms.ts` for `shortestPath` and
 * `connectedComponents`.
 *
 * @module store/graph-repository.impl
 */
import { connectedComponents as connectedComponentsAlgorithm, shortestPath as shortestPathAlgorithm } from '../graph/algorithms.js';
import type { GraphNode } from '../graph/types.js';
import type { EntityRepository } from './entity-repository.js';
import type { GraphPathResult, GraphRepository } from './graph-repository.js';
import type { RelationshipRepository } from './relationship-repository.js';

/** Creates a real {@link GraphRepository} over an {@link EntityRepository} and {@link RelationshipRepository}. */
export function createGraphRepository(entityRepository: EntityRepository, relationshipRepository: RelationshipRepository): GraphRepository {
  async function loadNode(organizationId: string, graphId: string, nodeId: string): Promise<GraphNode | null> {
    return entityRepository.findById(organizationId, graphId, nodeId);
  }

  return {
    async findEntity(organizationId, graphId, nodeId) {
      return entityRepository.findById(organizationId, graphId, nodeId);
    },

    async findEntities(organizationId, graphId, filter) {
      let entities = await entityRepository.findAll(organizationId, graphId);
      if (filter?.nodeType) entities = entities.filter((entity) => entity.nodeType === filter.nodeType);
      if (filter?.status) entities = entities.filter((entity) => (entity.status ?? 'active') === filter.status);
      return entities;
    },

    async findRelationships(organizationId, graphId, filter) {
      let relationships = await relationshipRepository.findAll(organizationId, graphId);
      if (filter?.relationshipType) relationships = relationships.filter((r) => r.relationshipType === filter.relationshipType);
      if (filter?.sourceNodeId) relationships = relationships.filter((r) => r.sourceNodeId === filter.sourceNodeId);
      if (filter?.targetNodeId) relationships = relationships.filter((r) => r.targetNodeId === filter.targetNodeId);
      return relationships;
    },

    async findNeighbors(organizationId, graphId, nodeId, direction = 'both') {
      const relationships = await relationshipRepository.findAll(organizationId, graphId);
      const neighborIds = new Set<string>();
      if (direction === 'out' || direction === 'both') {
        for (const r of relationships) if (r.sourceNodeId === nodeId) neighborIds.add(r.targetNodeId);
      }
      if (direction === 'in' || direction === 'both') {
        for (const r of relationships) if (r.targetNodeId === nodeId) neighborIds.add(r.sourceNodeId);
      }
      const nodes: GraphNode[] = [];
      for (const neighborId of neighborIds) {
        const node = await loadNode(organizationId, graphId, neighborId);
        if (node) nodes.push(node);
      }
      return nodes.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    },

    async findParents(organizationId, graphId, nodeId) {
      const relationships = await relationshipRepository.findBySource(organizationId, graphId, nodeId);
      const nodes: GraphNode[] = [];
      for (const relationship of relationships) {
        const node = await loadNode(organizationId, graphId, relationship.targetNodeId);
        if (node) nodes.push(node);
      }
      return nodes.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    },

    async findChildren(organizationId, graphId, nodeId) {
      const relationships = await relationshipRepository.findByTarget(organizationId, graphId, nodeId);
      const nodes: GraphNode[] = [];
      for (const relationship of relationships) {
        const node = await loadNode(organizationId, graphId, relationship.sourceNodeId);
        if (node) nodes.push(node);
      }
      return nodes.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    },

    async shortestPath(organizationId, graphId, sourceNodeId, targetNodeId): Promise<GraphPathResult | null> {
      const entities = await entityRepository.findAll(organizationId, graphId);
      const relationships = await relationshipRepository.findAll(organizationId, graphId);
      const result = shortestPathAlgorithm(
        entities.map((entity) => entity.nodeId),
        relationships,
        sourceNodeId,
        targetNodeId,
      );
      if (!result) return null;
      const byId = new Map(entities.map((entity) => [entity.nodeId, entity]));
      const nodes = result.path.map((nodeId) => byId.get(nodeId)).filter((node): node is GraphNode => node !== undefined);
      return { nodes, length: result.length };
    },

    async connectedComponents(organizationId, graphId) {
      const entities = await entityRepository.findAll(organizationId, graphId);
      const relationships = await relationshipRepository.findAll(organizationId, graphId);
      const components = connectedComponentsAlgorithm(
        entities.map((entity) => entity.nodeId),
        relationships,
      );
      const byId = new Map(entities.map((entity) => [entity.nodeId, entity]));
      return components.map((component) => component.map((nodeId) => byId.get(nodeId) as GraphNode));
    },
  };
}
