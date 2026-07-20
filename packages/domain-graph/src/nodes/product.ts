/** @module nodes/product */
import type { ProductId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type ProductNodeType = 'product';

/** Graph node representing a Product aggregate. */
export interface ProductGraphNode extends TypedGraphNode<'product', ProductId> {}

export const productNodeDefinition: GraphNodeDefinition<'product'> = {
  nodeType: 'product',
  description: 'Manufactured or printed product offered by the organization.',
};
