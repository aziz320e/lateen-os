/**
 * Real, in-memory {@link EntityRepository} implementation. `GraphNode`'s
 * natural key is `nodeId` (not `id`), so this is a small hand-rolled Map
 * store rather than `createInMemoryRepository` — same semantics, adapted
 * key.
 *
 * @module store/entity-repository.impl
 */
import type { GraphNode } from '../graph/types.js';
import type { EntityRepository } from './entity-repository.js';

function scopeKey(organizationId: string, graphId: string, nodeId: string): string {
  return `${organizationId}::${graphId}::${nodeId}`;
}

/** Creates a real, in-memory {@link EntityRepository}. */
export function createEntityRepository(seed?: readonly GraphNode[]): EntityRepository {
  const store = new Map<string, GraphNode>();
  for (const node of seed ?? []) {
    if (node.graphId) store.set(scopeKey(node.organizationId, node.graphId, node.nodeId), node);
  }

  function listInGraph(organizationId: string, graphId: string): GraphNode[] {
    return [...store.values()].filter((node) => node.organizationId === organizationId && node.graphId === graphId);
  }

  return {
    async findById(organizationId, graphId, nodeId) {
      return store.get(scopeKey(organizationId, graphId, nodeId)) ?? null;
    },
    async save(node) {
      if (!node.graphId) throw new Error('EntityRepository requires GraphNode.graphId to be set');
      store.set(scopeKey(node.organizationId, node.graphId, node.nodeId), node);
    },
    async delete(organizationId, graphId, nodeId) {
      store.delete(scopeKey(organizationId, graphId, nodeId));
    },
    async findAll(organizationId, graphId) {
      return listInGraph(organizationId, graphId);
    },
    async findByType(organizationId, graphId, nodeType) {
      return listInGraph(organizationId, graphId).filter((node) => node.nodeType === nodeType);
    },
    async findByStatus(organizationId, graphId, status) {
      return listInGraph(organizationId, graphId).filter((node) => (node.status ?? 'active') === status);
    },
    async findByEntityRef(organizationId, graphId, nodeType, entityId) {
      return (
        listInGraph(organizationId, graphId).find((node) => node.nodeType === nodeType && node.entityId === entityId) ?? null
      );
    },
  };
}
