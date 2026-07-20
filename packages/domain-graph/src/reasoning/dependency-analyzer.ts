/**
 * Dependency analyzer port — analyze DEPENDS_ON and REQUIRES chains.
 *
 * @module reasoning/dependency-analyzer
 */

import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { GraphPath } from '../graph/types.js';

/** A dependency chain from source to target. */
export interface DependencyChain {
  readonly path: GraphPath;
  readonly depth: number;
}

/** Result of dependency analysis for a node. */
export interface DependencyAnalysisResult {
  readonly nodeId: GraphNodeId;
  readonly upstreamDependencies: readonly GraphNodeId[];
  readonly downstreamDependents: readonly GraphNodeId[];
  readonly chains: readonly DependencyChain[];
}

/** Port for analyzing dependency relationships in the graph. */
export interface DependencyAnalyzer {
  analyzeDependencies(
    organizationId: OrganizationId,
    nodeId: GraphNodeId,
  ): Promise<DependencyAnalysisResult>;

  findDependencyChain(
    organizationId: OrganizationId,
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
  ): Promise<DependencyChain | null>;
}
