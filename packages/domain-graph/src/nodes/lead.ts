/** @module nodes/lead */
import type { LeadId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type LeadNodeType = 'lead';

/** Graph node representing a sales lead. */
export interface LeadGraphNode extends TypedGraphNode<'lead', LeadId> {}

export const leadNodeDefinition: GraphNodeDefinition<'lead'> = {
  nodeType: 'lead',
  description: 'Prospective customer not yet converted.',
};
