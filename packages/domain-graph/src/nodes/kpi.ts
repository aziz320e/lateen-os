/** @module nodes/kpi */
import type { KpiId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type KpiNodeType = 'kpi';

/** Graph node representing a KPI aggregate. */
export interface KpiGraphNode extends TypedGraphNode<'kpi', KpiId> {}

export const kpiNodeDefinition: GraphNodeDefinition<'kpi'> = {
  nodeType: 'kpi',
  description: 'Key performance indicator tracked by the organization.',
};
