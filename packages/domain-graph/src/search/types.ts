/** @module search/types */
import type { GraphNode, GraphNodeStatus } from '../graph/types.js';
import type { GraphNodeType } from '../nodes/node-type.js';

export interface SearchEntitiesQuery {
  readonly name?: string;
  readonly nodeType?: GraphNodeType;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly status?: GraphNodeStatus;
  readonly limit?: number;
}

export interface EntitySearchMatch {
  readonly entity: GraphNode;
  readonly score: number;
}
