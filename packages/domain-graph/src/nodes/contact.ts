/** @module nodes/contact */
import type { ContactId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type ContactNodeType = 'contact';

/** Graph node representing an individual contact person. */
export interface ContactGraphNode extends TypedGraphNode<'contact', ContactId> {}

export const contactNodeDefinition: GraphNodeDefinition<'contact'> = {
  nodeType: 'contact',
  description: 'Individual point of contact at a customer, supplier, or partner.',
};
