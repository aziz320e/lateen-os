/** @module nodes/order */
import type { OrderId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type OrderNodeType = 'order';

/** Graph node representing an Order aggregate. */
export interface OrderGraphNode extends TypedGraphNode<'order', OrderId> {}

export const orderNodeDefinition: GraphNodeDefinition<'order'> = {
  nodeType: 'order',
  description: 'Customer order for products or services.',
};
