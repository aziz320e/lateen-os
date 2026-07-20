/**
 * Graph traversal port — walk the domain graph from a starting node.
 *
 * @module traversal/graph-traversal
 */

import type { GraphEdge, GraphNode, GraphPath } from '../graph/types.js';
import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { RelationshipType } from '../relationships/relationship-type.js';
import type { GraphNodeType } from '../nodes/node-type.js';

/** Options for bounded graph traversal. */
export interface TraversalOptions {
  readonly organizationId: OrganizationId;
  readonly maxDepth?: number;
  readonly relationshipTypes?: readonly RelationshipType[];
  readonly targetNodeTypes?: readonly GraphNodeType[];
}

/** Port for traversing the domain graph from a root node. */
export interface GraphTraversal {
  traverseFrom(
    startNodeId: GraphNodeId,
    options: TraversalOptions,
  ): Promise<readonly GraphNode[]>;

  traverseEdgesFrom(
    startNodeId: GraphNodeId,
    options: TraversalOptions,
  ): Promise<readonly GraphEdge[]>;
}
