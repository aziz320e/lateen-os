/** @module nodes/supplier */
import type { SupplierId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type SupplierNodeType = 'supplier';

/** Graph node representing a Supplier aggregate. */
export interface SupplierGraphNode extends TypedGraphNode<'supplier', SupplierId> {}

export const supplierNodeDefinition: GraphNodeDefinition<'supplier'> = {
  nodeType: 'supplier',
  description: 'External supplier providing materials or services.',
};
