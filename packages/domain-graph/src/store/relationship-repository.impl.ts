/**
 * Real, in-memory {@link RelationshipRepository} implementation. Keyed by
 * `relationshipId` (the natural key on `GraphRelationship`).
 *
 * @module store/relationship-repository.impl
 */
import type { GraphRelationship } from '../graph/types.js';
import type { RelationshipRepository } from './relationship-repository.js';

function scopeKey(organizationId: string, graphId: string, relationshipId: string): string {
  return `${organizationId}::${graphId}::${relationshipId}`;
}

/** Creates a real, in-memory {@link RelationshipRepository}. */
export function createRelationshipRepository(seed?: readonly GraphRelationship[]): RelationshipRepository {
  const store = new Map<string, GraphRelationship>();
  for (const relationship of seed ?? []) {
    store.set(scopeKey(relationship.organizationId, relationship.graphId, relationship.relationshipId), relationship);
  }

  function listInGraph(organizationId: string, graphId: string): GraphRelationship[] {
    return [...store.values()].filter((relationship) => relationship.organizationId === organizationId && relationship.graphId === graphId);
  }

  return {
    async findById(organizationId, graphId, relationshipId) {
      return store.get(scopeKey(organizationId, graphId, relationshipId)) ?? null;
    },
    async save(relationship) {
      store.set(scopeKey(relationship.organizationId, relationship.graphId, relationship.relationshipId), relationship);
    },
    async delete(organizationId, graphId, relationshipId) {
      store.delete(scopeKey(organizationId, graphId, relationshipId));
    },
    async findAll(organizationId, graphId) {
      return listInGraph(organizationId, graphId);
    },
    async findByType(organizationId, graphId, relationshipType) {
      return listInGraph(organizationId, graphId).filter((relationship) => relationship.relationshipType === relationshipType);
    },
    async findBySource(organizationId, graphId, sourceNodeId) {
      return listInGraph(organizationId, graphId).filter((relationship) => relationship.sourceNodeId === sourceNodeId);
    },
    async findByTarget(organizationId, graphId, targetNodeId) {
      return listInGraph(organizationId, graphId).filter((relationship) => relationship.targetNodeId === targetNodeId);
    },
  };
}
