/** @module store/relationship-repository */
import type { DomainRelationshipType, GraphRelationship } from '../graph/types.js';
import type { DomainGraphId, GraphEdgeId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';

/** Persistence port for real {@link GraphRelationship} edges, scoped to one graph. */
export interface RelationshipRepository {
  findById(organizationId: OrganizationId, graphId: DomainGraphId, relationshipId: GraphEdgeId): Promise<GraphRelationship | null>;
  save(relationship: GraphRelationship): Promise<void>;
  delete(organizationId: OrganizationId, graphId: DomainGraphId, relationshipId: GraphEdgeId): Promise<void>;
  findAll(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly GraphRelationship[]>;
  findByType(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    relationshipType: DomainRelationshipType,
  ): Promise<readonly GraphRelationship[]>;
  findBySource(organizationId: OrganizationId, graphId: DomainGraphId, sourceNodeId: GraphNodeId): Promise<readonly GraphRelationship[]>;
  findByTarget(organizationId: OrganizationId, graphId: DomainGraphId, targetNodeId: GraphNodeId): Promise<readonly GraphRelationship[]>;
}
