/** @module store/entity-repository */
import type { GraphNode, GraphNodeStatus } from '../graph/types.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { DomainGraphId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';

/** Persistence port for registered {@link GraphNode} entities, scoped to one graph. */
export interface EntityRepository {
  findById(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<GraphNode | null>;
  save(node: GraphNode): Promise<void>;
  delete(organizationId: OrganizationId, graphId: DomainGraphId, nodeId: GraphNodeId): Promise<void>;
  findAll(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly GraphNode[]>;
  findByType(organizationId: OrganizationId, graphId: DomainGraphId, nodeType: GraphNodeType): Promise<readonly GraphNode[]>;
  findByStatus(organizationId: OrganizationId, graphId: DomainGraphId, status: GraphNodeStatus): Promise<readonly GraphNode[]>;
  /** Looks up an entity by its underlying business entity reference — used for duplicate detection. */
  findByEntityRef(organizationId: OrganizationId, graphId: DomainGraphId, nodeType: GraphNodeType, entityId: string): Promise<GraphNode | null>;
}
