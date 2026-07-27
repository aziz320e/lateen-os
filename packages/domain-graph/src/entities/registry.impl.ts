/**
 * Real Entity Registry — registers, updates, and archives first-class
 * graph entities across all 27 supported {@link GraphNodeType}s.
 *
 * @module entities/registry.impl
 */
import type { DomainGraphEventBus } from '../events/domain-graph-event-bus.js';
import type { GraphNode } from '../graph/types.js';
import { GraphEntityNotFoundError, InvalidGraphTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DomainGraphId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { EntityRepository } from '../store/entity-repository.js';
import type { RegisterEntityInput, UpdateEntityInput } from './types.js';

export interface EntityRegistry {
  register(organizationId: OrganizationId, graphId: DomainGraphId, input: RegisterEntityInput): Promise<GraphNode>;
  update(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId, patch: UpdateEntityInput): Promise<GraphNode>;
  archive(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<GraphNode>;
  get(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<GraphNode | null>;
  list(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly GraphNode[]>;
}

/** Creates a real {@link EntityRegistry} backed by an {@link EntityRepository}. */
export function createEntityRegistry(
  repository: EntityRepository,
  eventBus?: DomainGraphEventBus,
  now: () => string = nowIso,
): EntityRegistry {
  async function requireEntity(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<GraphNode> {
    const entity = await repository.findById(organizationId, graphId, nodeId);
    if (!entity) throw new GraphEntityNotFoundError(nodeId);
    return entity;
  }

  return {
    async register(organizationId, graphId, input) {
      const timestamp = now();
      const node: GraphNode = {
        nodeId: generateId('node'),
        organizationId,
        graphId,
        nodeType: input.nodeType,
        entityId: input.entityId,
        label: input.label,
        properties: input.properties,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await repository.save(node);
      eventBus?.publish('entity.created', { nodeId: node.nodeId, organizationId, graphId, nodeType: node.nodeType });
      return node;
    },

    async update(organizationId, graphId, nodeId, patch) {
      const entity = await requireEntity(organizationId, graphId, nodeId);
      if ((entity.status ?? 'active') === 'archived') {
        throw new InvalidGraphTransitionError(nodeId, entity.status ?? 'archived', 'updated');
      }
      const updated: GraphNode = {
        ...entity,
        label: patch.label ?? entity.label,
        properties: patch.properties ?? entity.properties,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('entity.updated', { nodeId, organizationId, graphId });
      return updated;
    },

    async archive(organizationId, graphId, nodeId) {
      const entity = await requireEntity(organizationId, graphId, nodeId);
      const updated: GraphNode = { ...entity, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('entity.archived', { nodeId, organizationId, graphId });
      return updated;
    },

    async get(organizationId, graphId, nodeId) {
      return repository.findById(organizationId, graphId, nodeId);
    },

    async list(organizationId, graphId) {
      return repository.findAll(organizationId, graphId);
    },
  };
}
