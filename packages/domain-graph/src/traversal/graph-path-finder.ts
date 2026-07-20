/**
 * Graph path finder port — discover routes between nodes.
 *
 * @module traversal/graph-path-finder
 */

import type { GraphPath } from '../graph/types.js';
import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** Options for path finding between two nodes. */
export interface PathFindOptions {
  readonly organizationId: OrganizationId;
  readonly relationshipTypes?: readonly RelationshipType[];
  readonly maxDepth?: number;
}

/** Port for finding paths between nodes in the domain graph. */
export interface GraphPathFinder {
  findPath(
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
    options: PathFindOptions,
  ): Promise<GraphPath | null>;

  findAllPaths(
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
    options: PathFindOptions,
  ): Promise<readonly GraphPath[]>;
}
