/**
 * Impact analyzer port — analyze downstream effects of graph changes.
 *
 * @module reasoning/impact-analyzer
 */

import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { ImpactedEntitiesResult } from '../queries/types.js';

/** Scenario describing a hypothetical graph change. */
export interface ImpactScenario {
  readonly organizationId: OrganizationId;
  readonly sourceNodeId: GraphNodeId;
  readonly changeType: 'remove' | 'deactivate' | 'modify';
  readonly maxDepth?: number;
}

/** Aggregated impact summary grouped by node type. */
export interface ImpactSummary {
  readonly scenario: ImpactScenario;
  readonly impactedByType: Readonly<Partial<Record<GraphNodeType, number>>>;
  readonly totalImpacted: number;
}

/** Port for analyzing downstream impact of entity changes. */
export interface ImpactAnalyzer {
  analyzeImpact(scenario: ImpactScenario): Promise<ImpactedEntitiesResult>;

  summarizeImpact(scenario: ImpactScenario): Promise<ImpactSummary>;
}
