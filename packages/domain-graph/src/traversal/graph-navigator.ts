/**
 * Graph navigator port — direct neighbor access and local navigation.
 *
 * @module traversal/graph-navigator
 */

import type { GraphEdge, GraphNode } from '../graph/types.js';
import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** Direction of edge traversal relative to a node. */
export type TraversalDirection = 'outgoing' | 'incoming' | 'both';

/** Options for neighbor navigation. */
export interface NavigationOptions {
  readonly organizationId: OrganizationId;
  readonly direction?: TraversalDirection;
  readonly relationshipTypes?: readonly RelationshipType[];
}

/** Port for navigating immediate neighbors of a node. */
export interface GraphNavigator {
  getNode(organizationId: OrganizationId, nodeId: GraphNodeId): Promise<GraphNode | null>;

  getOutgoingNeighbors(
    nodeId: GraphNodeId,
    options: NavigationOptions,
  ): Promise<readonly GraphNode[]>;

  getIncomingNeighbors(
    nodeId: GraphNodeId,
    options: NavigationOptions,
  ): Promise<readonly GraphNode[]>;

  getIncidentEdges(nodeId: GraphNodeId, options: NavigationOptions): Promise<readonly GraphEdge[]>;
}
