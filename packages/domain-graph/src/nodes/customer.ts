/** @module nodes/customer */
import type { CustomerId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type CustomerNodeType = 'customer';

/** Graph node representing a Customer aggregate. */
export interface CustomerGraphNode extends TypedGraphNode<'customer', CustomerId> {}

export const customerNodeDefinition: GraphNodeDefinition<'customer'> = {
  nodeType: 'customer',
  description: 'B2B or B2C customer of the organization.',
};
