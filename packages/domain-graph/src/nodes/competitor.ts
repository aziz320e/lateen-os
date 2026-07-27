/** @module nodes/competitor */
import type { CompetitorId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type CompetitorNodeType = 'competitor';

/** Graph node representing a tracked market competitor. */
export interface CompetitorGraphNode extends TypedGraphNode<'competitor', CompetitorId> {}

export const competitorNodeDefinition: GraphNodeDefinition<'competitor'> = {
  nodeType: 'competitor',
  description: 'Tracked market competitor (Business DNA Competitor Registry).',
};
