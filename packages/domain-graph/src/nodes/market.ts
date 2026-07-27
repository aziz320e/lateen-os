/** @module nodes/market */
import type { MarketId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type MarketNodeType = 'market';

/** Graph node representing an operating market (Business DNA Market Model). */
export interface MarketGraphNode extends TypedGraphNode<'market', MarketId> {}

export const marketNodeDefinition: GraphNodeDefinition<'market'> = {
  nodeType: 'market',
  description: 'Operating market — country/region/currency the organization serves.',
};
