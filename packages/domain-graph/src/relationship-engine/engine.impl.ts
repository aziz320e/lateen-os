/**
 * Real Relationship Engine — creates, updates, and deletes typed
 * relationships between registered graph entities. Guards against
 * dangling references at creation time (both endpoints must already be
 * registered, non-archived entities).
 *
 * @module relationship-engine/engine.impl
 */
import type { DomainGraphEventBus } from '../events/domain-graph-event-bus.js';
import type { GraphRelationship } from '../graph/types.js';
import { DanglingRelationshipError, GraphRelationshipNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DomainGraphId, GraphEdgeId, OrganizationId } from '../shared/identifiers.js';
import type { EntityRepository } from '../store/entity-repository.js';
import type { RelationshipRepository } from '../store/relationship-repository.js';
import type { CreateRelationshipInput, UpdateRelationshipInput } from './types.js';

export interface RelationshipEngine {
  create(organizationId: OrganizationId, graphId: DomainGraphId, input: CreateRelationshipInput): Promise<GraphRelationship>;
  update(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    relationshipId: GraphEdgeId,
    patch: UpdateRelationshipInput,
  ): Promise<GraphRelationship>;
  delete(organizationId: OrganizationId, graphId: DomainGraphId, relationshipId: GraphEdgeId): Promise<void>;
  get(organizationId: OrganizationId, graphId: DomainGraphId, relationshipId: GraphEdgeId): Promise<GraphRelationship | null>;
  list(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly GraphRelationship[]>;
}

/** Creates a real {@link RelationshipEngine} over an {@link EntityRepository} and {@link RelationshipRepository}. */
export function createRelationshipEngine(
  entityRepository: EntityRepository,
  relationshipRepository: RelationshipRepository,
  eventBus?: DomainGraphEventBus,
  now: () => string = nowIso,
): RelationshipEngine {
  async function requireRelationship(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    relationshipId: GraphEdgeId,
  ): Promise<GraphRelationship> {
    const relationship = await relationshipRepository.findById(organizationId, graphId, relationshipId);
    if (!relationship) throw new GraphRelationshipNotFoundError(relationshipId);
    return relationship;
  }

  return {
    async create(organizationId, graphId, input) {
      const source = await entityRepository.findById(organizationId, graphId, input.sourceNodeId);
      if (!source) throw new DanglingRelationshipError(input.sourceNodeId, 'source');
      const target = await entityRepository.findById(organizationId, graphId, input.targetNodeId);
      if (!target) throw new DanglingRelationshipError(input.targetNodeId, 'target');

      const timestamp = now();
      const relationship: GraphRelationship = {
        relationshipId: generateId('rel'),
        organizationId,
        graphId,
        relationshipType: input.relationshipType,
        sourceNodeId: input.sourceNodeId,
        targetNodeId: input.targetNodeId,
        label: input.label,
        properties: input.properties,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await relationshipRepository.save(relationship);
      eventBus?.publish('relationship.created', {
        relationshipId: relationship.relationshipId,
        organizationId,
        graphId,
        relationshipType: relationship.relationshipType,
        sourceNodeId: relationship.sourceNodeId,
        targetNodeId: relationship.targetNodeId,
      });
      return relationship;
    },

    async update(organizationId, graphId, relationshipId, patch) {
      const relationship = await requireRelationship(organizationId, graphId, relationshipId);
      const updated: GraphRelationship = {
        ...relationship,
        label: patch.label ?? relationship.label,
        properties: patch.properties ?? relationship.properties,
        updatedAt: now(),
      };
      await relationshipRepository.save(updated);
      eventBus?.publish('relationship.updated', { relationshipId, organizationId, graphId });
      return updated;
    },

    async delete(organizationId, graphId, relationshipId) {
      await requireRelationship(organizationId, graphId, relationshipId);
      await relationshipRepository.delete(organizationId, graphId, relationshipId);
      eventBus?.publish('relationship.deleted', { relationshipId, organizationId, graphId });
    },

    async get(organizationId, graphId, relationshipId) {
      return relationshipRepository.findById(organizationId, graphId, relationshipId);
    },

    async list(organizationId, graphId) {
      return relationshipRepository.findAll(organizationId, graphId);
    },
  };
}
