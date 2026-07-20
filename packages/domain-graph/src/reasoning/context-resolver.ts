/**
 * Context resolver port — assemble entity context from graph neighborhood.
 *
 * @module reasoning/context-resolver
 */

import type { GraphNode, GraphSnapshot } from '../graph/types.js';
import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { GraphNodeType } from '../nodes/node-type.js';

/** Options for resolving contextual subgraph around an entity. */
export interface ContextResolveOptions {
  readonly organizationId: OrganizationId;
  readonly centerNodeId: GraphNodeId;
  readonly includeNodeTypes?: readonly GraphNodeType[];
  readonly radius?: number;
}

/** Entity context bundle for AI agents and intelligence layers. */
export interface EntityContext {
  readonly center: GraphNode;
  readonly subgraph: GraphSnapshot;
  readonly resolvedAt: string;
}

/** Port for resolving operational context from the domain graph. */
export interface ContextResolver {
  resolveContext(options: ContextResolveOptions): Promise<EntityContext>;

  resolveContextForEntity(
    organizationId: OrganizationId,
    nodeType: GraphNodeType,
    entityId: string,
  ): Promise<EntityContext | null>;
}
