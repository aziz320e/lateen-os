/** @module nodes/invoice */
import type { InvoiceId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type InvoiceNodeType = 'invoice';

/** Graph node representing an Invoice aggregate. */
export interface InvoiceGraphNode extends TypedGraphNode<'invoice', InvoiceId> {}

export const invoiceNodeDefinition: GraphNodeDefinition<'invoice'> = {
  nodeType: 'invoice',
  description: 'Invoice billing document for an order or service.',
};
