/** @module store/graph-repository */
import type { DomainRelationshipType, GraphNode, GraphNodeStatus, GraphRelationship } from '../graph/types.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { DomainGraphId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';

export interface EntityFilter {
  readonly nodeType?: GraphNodeType;
  readonly status?: GraphNodeStatus;
}

export interface RelationshipFilter {
  readonly relationshipType?: DomainRelationshipType;
  readonly sourceNodeId?: GraphNodeId;
  readonly targetNodeId?: GraphNodeId;
}

export type NeighborDirection = 'in' | 'out' | 'both';

export interface GraphPathResult {
  readonly nodes: readonly GraphNode[];
  readonly length: number;
}

/**
 * Real, tenant-scoped Graph Repository — the read facade over the
 * internal {@link EntityRepository} and {@link RelationshipRepository}.
 * Never exposed directly by the composition root; only consumed by
 * services and the query layer.
 */
export interface GraphRepository {
  findEntity(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<GraphNode | null>;
  findEntities(organizationId: OrganizationId, graphId: DomainGraphId, filter?: EntityFilter): Promise<readonly GraphNode[]>;
  findRelationships(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    filter?: RelationshipFilter,
  ): Promise<readonly GraphRelationship[]>;
  findNeighbors(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    nodeId: GraphNodeId,
    direction?: NeighborDirection,
  ): Promise<readonly GraphNode[]>;
  findParents(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<readonly GraphNode[]>;
  findChildren(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<readonly GraphNode[]>;
  shortestPath(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
  ): Promise<GraphPathResult | null>;
  connectedComponents(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly (readonly GraphNode[])[]>;
}
