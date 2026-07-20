/**
 * Graph explorer port — browse and inspect graph structure at scale.
 *
 * @module traversal/graph-explorer
 */

import type { GraphMetadata, GraphSnapshot } from '../graph/types.js';
import type { GraphSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** Filter for exploring subgraphs. */
export interface GraphExploreFilter {
  readonly organizationId: OrganizationId;
  readonly nodeTypes?: readonly GraphNodeType[];
  readonly relationshipTypes?: readonly RelationshipType[];
  readonly limit?: number;
  readonly offset?: number;
}

/** Port for exploring and exporting graph views. */
export interface GraphExplorer {
  getMetadata(organizationId: OrganizationId): Promise<GraphMetadata>;

  exploreSubgraph(filter: GraphExploreFilter): Promise<GraphSnapshot>;

  getSnapshot(
    organizationId: OrganizationId,
    snapshotId: GraphSnapshotId,
  ): Promise<GraphSnapshot | null>;
}
