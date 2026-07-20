/** @module nodes/quotation */
import type { QuotationId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type QuotationNodeType = 'quotation';

/** Graph node representing a Quotation aggregate. */
export interface QuotationGraphNode extends TypedGraphNode<'quotation', QuotationId> {}

export const quotationNodeDefinition: GraphNodeDefinition<'quotation'> = {
  nodeType: 'quotation',
  description: 'Commercial quotation issued to a customer.',
};
